import uuid
from decimal import Decimal
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ShareAccount, ShareTransaction, DividendRecord
from .serializers import ShareAccountSerializer, ShareTransactionSerializer, DividendRecordSerializer
from apps.tenants.permissions import EnforceTenantIsolation

class ShareAccountViewSet(viewsets.ModelViewSet):
    queryset = ShareAccount.objects.all()
    serializer_class = ShareAccountSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return ShareAccount.objects.all()
        if user.role == 'FARMER':
            return ShareAccount.objects.filter(member__user=user, tenant=user.tenant)
        if user.tenant:
            return ShareAccount.objects.filter(tenant=user.tenant)
        return ShareAccount.objects.none()

    @action(detail=True, methods=['post'], url_path='transact')
    def transact(self, request, pk=None):
        share_account = self.get_object()
        t_type = request.data.get('transaction_type') # DEPOSIT or WITHDRAWAL
        num_shares = int(request.data.get('number_of_shares', 0))
        remarks = request.data.get('remarks', '')

        if num_shares <= 0:
            return Response({'detail': 'Number of shares must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

        amount = Decimal(num_shares) * share_account.share_unit_price

        with transaction.atomic():
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

            ref_no = f"TXN-SH-{uuid.uuid4().hex[:8].upper()}"
            txn = ShareTransaction.objects.create(
                tenant=share_account.tenant,
                share_account=share_account,
                transaction_type=t_type,
                number_of_shares=num_shares,
                amount=amount,
                reference_number=ref_no,
                remarks=remarks
            )

        return Response({
            'message': 'Share transaction recorded successfully.',
            'share_account': ShareAccountSerializer(share_account).data,
            'transaction': ShareTransactionSerializer(txn).data
        })

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
