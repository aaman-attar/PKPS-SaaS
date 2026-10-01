import uuid
from decimal import Decimal
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .models import ShareAccount, ShareTransaction, DividendRecord
from .serializers import ShareAccountSerializer, ShareTransactionSerializer, DividendRecordSerializer
from apps.tenants.permissions import EnforceTenantIsolation, validate_tenant_object
from apps.accounting.services import post_share_purchase_journal, post_share_redemption_journal
from apps.audit.services import record_audit

class ShareAccountViewSet(viewsets.ModelViewSet):
    queryset = ShareAccount.objects.all()
    serializer_class = ShareAccountSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        from apps.deposits.services import ensure_member_financial_accounts
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return ShareAccount.objects.all()
        if user.role == 'FARMER':
            from apps.members.models import Member
            member = Member.objects.filter(user=user, tenant=user.tenant).first()
            if member:
                ensure_member_financial_accounts(member)
            return ShareAccount.objects.filter(member__user=user, tenant=user.tenant)
        if user.tenant:
            from apps.members.models import Member
            for m in Member.objects.filter(tenant=user.tenant, status='ACTIVE', share_account__isnull=True):
                ensure_member_financial_accounts(m)
            return ShareAccount.objects.filter(tenant=user.tenant)
        return ShareAccount.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'FARMER':
            raise PermissionDenied("Farmers cannot directly issue share accounts.")
        sa = serializer.save(tenant=self.request.user.tenant)
        record_audit(self.request.user, 'CREATE_SHARE_ACCOUNT', 'SHARES', 'ShareAccount', sa.id)

    def perform_update(self, serializer):
        if self.request.user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'PKPS_ADMIN', 'SECRETARY']:
            raise PermissionDenied("Direct modification of share account details restricted.")
        sa = serializer.save()
        record_audit(self.request.user, 'UPDATE_SHARE_ACCOUNT', 'SHARES', 'ShareAccount', sa.id)

    @action(detail=True, methods=['post'], url_path='transact')
    def transact(self, request, pk=None):
        share_account_obj = self.get_object()
        validate_tenant_object(share_account_obj, request.user)

        t_type = request.data.get('transaction_type') # DEPOSIT or WITHDRAWAL
        allowed_roles = ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'PKPS_ADMIN', 'SECRETARY', 'MANAGER', 'ACCOUNTANT', 'CASHIER']
        if request.user.role == 'FARMER':
            if share_account_obj.member.user != request.user:
                raise PermissionDenied("You can only purchase shares for your own account.")
            if t_type != 'DEPOSIT':
                raise PermissionDenied("Farmers can only purchase additional shares. For liquidation/refund, please apply to the PKPS Board.")
        elif request.user.role not in allowed_roles:
            raise PermissionDenied("Unauthorized to process share transactions.")
        try:
            num_shares = int(request.data.get('number_of_shares', 0))
        except Exception:
            return Response({'detail': 'Invalid number of shares.'}, status=status.HTTP_400_BAD_REQUEST)

        remarks = request.data.get('remarks', '')
        idempotency_key = request.data.get('idempotency_key', '').strip()

        if num_shares <= 0:
            return Response({'detail': 'Number of shares must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

        if idempotency_key:
            existing_txn = ShareTransaction.objects.filter(
                tenant=share_account_obj.tenant, reference_number=idempotency_key
            ).first()
            if existing_txn:
                return Response({
                    'message': 'Duplicate transaction request skipped (idempotent).',
                    'share_account': ShareAccountSerializer(share_account_obj).data,
                    'transaction': ShareTransactionSerializer(existing_txn).data
                })

        with transaction.atomic():
            # Row lock
            share_account = ShareAccount.objects.select_for_update().get(pk=share_account_obj.pk)
            amount = Decimal(num_shares) * share_account.share_unit_price

            if t_type == 'DEPOSIT':
                share_account.total_shares += num_shares
                share_account.total_amount += amount
            elif t_type == 'WITHDRAWAL':
                if share_account.total_shares < num_shares:
                    return Response({'detail': 'Insufficient share balance.'}, status=status.HTTP_400_BAD_REQUEST)
                share_account.total_shares -= num_shares
                share_account.total_amount -= amount
            else:
                return Response({'detail': 'Invalid transaction type.'}, status=status.HTTP_400_BAD_REQUEST)

            share_account.save()

            ref_no = idempotency_key if idempotency_key else f"TXN-SH-{uuid.uuid4().hex[:8].upper()}"
            txn = ShareTransaction.objects.create(
                tenant=share_account.tenant,
                share_account=share_account,
                transaction_type=t_type,
                number_of_shares=num_shares,
                amount=amount,
                reference_number=ref_no,
                remarks=remarks
            )

            # Trigger double-entry accounting entries
            if t_type == 'DEPOSIT':
                post_share_purchase_journal(share_account.tenant, request.user, share_account.member, amount)
            elif t_type == 'WITHDRAWAL':
                post_share_redemption_journal(share_account.tenant, request.user, share_account.member, amount)

            record_audit(request.user, f'SHARE_{t_type}', 'SHARES', 'ShareAccount', share_account.id, new_values={'shares': num_shares, 'amount': str(amount)})

        return Response({
            'message': 'Share transaction recorded successfully.',
            'share_account': ShareAccountSerializer(share_account).data,
            'transaction': ShareTransactionSerializer(txn).data
        })

class ShareTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """Immutable share transaction history - read-only for security."""
    queryset = ShareTransaction.objects.all()
    serializer_class = ShareTransactionSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return ShareTransaction.objects.all()
        if user.role == 'FARMER':
            return ShareTransaction.objects.filter(share_account__member__user=user, tenant=user.tenant)
        if user.tenant:
            return ShareTransaction.objects.filter(tenant=user.tenant)
        return ShareTransaction.objects.none()

class DividendRecordViewSet(viewsets.ModelViewSet):
    queryset = DividendRecord.objects.all()
    serializer_class = DividendRecordSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return DividendRecord.objects.all()
        if user.role == 'FARMER':
            return DividendRecord.objects.filter(member__user=user, tenant=user.tenant)
        if user.tenant:
            return DividendRecord.objects.filter(tenant=user.tenant)
        return DividendRecord.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'PKPS_ADMIN', 'SECRETARY', 'ACCOUNTANT']:
            raise PermissionDenied("Only authorized staff can record dividend distributions.")
        div = serializer.save(tenant=self.request.user.tenant)
        record_audit(self.request.user, 'RECORD_DIVIDEND', 'SHARES', 'DividendRecord', div.id, new_values={'amount': str(div.dividend_amount)})
