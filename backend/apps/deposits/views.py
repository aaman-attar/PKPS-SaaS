import uuid
from decimal import Decimal
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import SavingsAccount, DepositTransaction, TermDeposit
from .serializers import SavingsAccountSerializer, DepositTransactionSerializer, TermDepositSerializer
from .services import ensure_member_financial_accounts
from apps.tenants.permissions import EnforceTenantIsolation, validate_tenant_object
from apps.accounting.services import post_savings_deposit_journal, post_savings_withdrawal_journal
from apps.audit.services import record_audit

class SavingsAccountViewSet(viewsets.ModelViewSet):
    queryset = SavingsAccount.objects.all()
    serializer_class = SavingsAccountSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return SavingsAccount.objects.all()
        if user.role == 'FARMER':
            from apps.members.models import Member
            member = Member.objects.filter(user=user, tenant=user.tenant).first()
            if member:
                ensure_member_financial_accounts(member)
            return SavingsAccount.objects.filter(member__user=user, tenant=user.tenant)
        if user.tenant:
            from apps.members.models import Member
            for m in Member.objects.filter(tenant=user.tenant, status='ACTIVE', savings_account__isnull=True):
                ensure_member_financial_accounts(m)
            return SavingsAccount.objects.filter(tenant=user.tenant)
        return SavingsAccount.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'FARMER':
            raise PermissionDenied("Farmers cannot directly create savings accounts.")
        acc = serializer.save(tenant=self.request.user.tenant)
        record_audit(self.request.user, 'CREATE_SAVINGS_ACCOUNT', 'DEPOSITS', 'SavingsAccount', acc.id)

    def perform_update(self, serializer):
        if self.request.user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'PKPS_ADMIN', 'MANAGER']:
            raise PermissionDenied("Direct modification of savings account details restricted.")
        acc = serializer.save()
        record_audit(self.request.user, 'UPDATE_SAVINGS_ACCOUNT', 'DEPOSITS', 'SavingsAccount', acc.id)

    @action(detail=True, methods=['post'], url_path='transact')
    def transact(self, request, pk=None):
        account_obj = self.get_object()
        validate_tenant_object(account_obj, request.user)

        t_type = request.data.get('transaction_type') # DEPOSIT or WITHDRAWAL
        amount_val = request.data.get('amount', 0)
        remarks = request.data.get('remarks', '')
        idempotency_key = request.data.get('idempotency_key', '').strip()

        if request.user.role == 'FARMER':
            if account_obj.member.user != request.user:
                raise PermissionDenied("You can only deposit funds into your own savings account.")
            if t_type != 'DEPOSIT':
                raise PermissionDenied("Farmer self-service only supports Deposits. For cash withdrawals, please visit the PKPS counter.")
        elif request.user.role in ['AUDITOR']:
            raise PermissionDenied("Auditors cannot process financial transactions.")

        try:
            amount = Decimal(str(amount_val))
        except Exception:
            return Response({'detail': 'Invalid decimal amount.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({'detail': 'Amount must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

        # Financial Idempotency Check
        if idempotency_key:
            existing_txn = DepositTransaction.objects.filter(
                tenant=account_obj.tenant, reference_number=idempotency_key
            ).first()
            if existing_txn:
                return Response({
                    'message': 'Duplicate transaction request skipped (idempotent).',
                    'savings_account': SavingsAccountSerializer(account_obj).data,
                    'transaction': DepositTransactionSerializer(existing_txn).data
                })

        with transaction.atomic():
            # Lock row using select_for_update
            account = SavingsAccount.objects.select_for_update().get(pk=account_obj.pk)

            if t_type in ['DEPOSIT', 'INTEREST_CREDIT']:
                account.current_balance += amount
            elif t_type == 'WITHDRAWAL':
                if account.current_balance < amount:
                    return Response({'detail': 'Insufficient balance.'}, status=status.HTTP_400_BAD_REQUEST)
                account.current_balance -= amount
            else:
                return Response({'detail': 'Invalid transaction type.'}, status=status.HTTP_400_BAD_REQUEST)

            account.save()

            ref_no = idempotency_key if idempotency_key else f"TXN-DEP-{uuid.uuid4().hex[:8].upper()}"
            txn = DepositTransaction.objects.create(
                tenant=account.tenant,
                savings_account=account,
                transaction_type=t_type,
                amount=amount,
                balance_after=account.current_balance,
                reference_number=ref_no,
                remarks=remarks
            )

            # Trigger double-entry accounting entries
            if t_type in ['DEPOSIT', 'INTEREST_CREDIT']:
                post_savings_deposit_journal(account.tenant, request.user, account.member, amount)
            elif t_type == 'WITHDRAWAL':
                post_savings_withdrawal_journal(account.tenant, request.user, account.member, amount)

            record_audit(request.user, f'SAVINGS_{t_type}', 'DEPOSITS', 'SavingsAccount', account.id, new_values={'amount': str(amount)})

        return Response({
            'message': 'Deposit transaction completed successfully.',
            'savings_account': SavingsAccountSerializer(account).data,
            'transaction': DepositTransactionSerializer(txn).data
        })


class DepositTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """Immutable ledger transaction history - read-only for security."""
    queryset = DepositTransaction.objects.all()
    serializer_class = DepositTransactionSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        qs = DepositTransaction.objects.all()
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            pass
        elif user.role == 'FARMER':
            qs = qs.filter(savings_account__member__user=user, tenant=user.tenant)
        elif user.tenant:
            qs = qs.filter(tenant=user.tenant)
        else:
            return DepositTransaction.objects.none()

        acc_id = self.request.query_params.get('savings_account')
        if acc_id:
            qs = qs.filter(savings_account_id=acc_id)
        return qs.order_by('-transaction_date')


class TermDepositViewSet(viewsets.ModelViewSet):
    queryset = TermDeposit.objects.all()
    serializer_class = TermDepositSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return TermDeposit.objects.all()
        if user.role == 'FARMER':
            return TermDeposit.objects.filter(member__user=user, tenant=user.tenant)
        if user.tenant:
            return TermDeposit.objects.filter(tenant=user.tenant)
        return TermDeposit.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        tenant = user.tenant

        if user.role == 'FARMER':
            from apps.members.models import Member
            member = Member.objects.filter(user=user, tenant=tenant).first()
            if not member:
                raise PermissionDenied("You must be an active registered member to open a term deposit.")
            
            principal = serializer.validated_data.get('principal_amount')
            rate = serializer.validated_data.get('interest_rate_pa', Decimal('7.50'))
            months = serializer.validated_data.get('tenure_months', 12)

            start_date = timezone.now().date()
            maturity_date = start_date + timedelta(days=months * 30)
            interest = (principal * rate * Decimal(str(months))) / Decimal('1200')
            maturity_amount = principal + interest
            
            dep_count = TermDeposit.objects.filter(tenant=tenant).count() + 1
            dep_num = f"TD-{tenant.code.split('-')[-1] if tenant and tenant.code else '001'}-{dep_count:05d}"

            savings = SavingsAccount.objects.filter(member=member).first()
            if savings and savings.current_balance >= principal:
                with transaction.atomic():
                    savings.current_balance -= principal
                    savings.save()
                    DepositTransaction.objects.create(
                        tenant=tenant,
                        savings_account=savings,
                        transaction_type='WITHDRAWAL',
                        amount=principal,
                        balance_after=savings.current_balance,
                        reference_number=f"TXN-FD-{uuid.uuid4().hex[:8].upper()}",
                        remarks=f"Funded Fixed Deposit {dep_num}"
                    )
            
            td = serializer.save(
                tenant=tenant,
                member=member,
                deposit_number=dep_num,
                interest_rate_pa=rate,
                maturity_date=maturity_date,
                maturity_amount=maturity_amount,
                status='ACTIVE'
            )
            record_audit(user, 'OPEN_TERM_DEPOSIT', 'DEPOSITS', 'TermDeposit', td.id)
            return

        # PKPS Staff opening term deposit for a member
        member_id = self.request.data.get('member_id')
        from apps.members.models import Member
        member = Member.objects.filter(pk=member_id, tenant=tenant).first() if member_id else None
        
        principal = serializer.validated_data.get('principal_amount')
        rate = serializer.validated_data.get('interest_rate_pa', Decimal('7.50'))
        months = serializer.validated_data.get('tenure_months', 12)
        start_date = timezone.now().date()
        maturity_date = start_date + timedelta(days=months * 30)
        interest = (principal * rate * Decimal(str(months))) / Decimal('1200')
        maturity_amount = principal + interest

        dep_count = TermDeposit.objects.filter(tenant=tenant).count() + 1
        dep_num = f"TD-{tenant.code.split('-')[-1] if tenant and tenant.code else '001'}-{dep_count:05d}"

        save_kwargs = {
            'tenant': tenant,
            'deposit_number': dep_num,
            'maturity_date': maturity_date,
            'maturity_amount': maturity_amount,
            'status': 'ACTIVE'
        }
        if member:
            save_kwargs['member'] = member

        td = serializer.save(**save_kwargs)
        record_audit(user, 'CREATE_TERM_DEPOSIT', 'DEPOSITS', 'TermDeposit', td.id)
