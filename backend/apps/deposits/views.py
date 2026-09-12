import uuid
from decimal import Decimal
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SavingsAccount, DepositTransaction, TermDeposit
from .serializers import SavingsAccountSerializer, DepositTransactionSerializer, TermDepositSerializer
from apps.tenants.permissions import EnforceTenantIsolation

class SavingsAccountViewSet(viewsets.ModelViewSet):
    queryset = SavingsAccount.objects.all()
    serializer_class = SavingsAccountSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return SavingsAccount.objects.all()
        if user.role == 'FARMER':
            return SavingsAccount.objects.filter(member__user=user, tenant=user.tenant)
        if user.tenant:
            return SavingsAccount.objects.filter(tenant=user.tenant)
        return SavingsAccount.objects.none()

    @action(detail=True, methods=['post'], url_path='transact')
    def transact(self, request, pk=None):
        account = self.get_object()
        t_type = request.data.get('transaction_type') # DEPOSIT or WITHDRAWAL
        amount = Decimal(request.data.get('amount', 0))
        remarks = request.data.get('remarks', '')

        if amount <= 0:
            return Response({'detail': 'Amount must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            if t_type in ['DEPOSIT', 'INTEREST_CREDIT']:
                account.current_balance += amount
            elif t_type == 'WITHDRAWAL':
                if account.current_balance < amount:
                    return Response({'detail': 'Insufficient balance.'}, status=status.HTTP_400_BAD_REQUEST)
                account.current_balance -= amount
            else:
                return Response({'detail': 'Invalid transaction type.'}, status=status.HTTP_400_BAD_REQUEST)

            account.save()

            ref_no = f"TXN-DEP-{uuid.uuid4().hex[:8].upper()}"
            txn = DepositTransaction.objects.create(
                tenant=account.tenant,
                savings_account=account,
                transaction_type=t_type,
                amount=amount,
                balance_after=account.current_balance,
                reference_number=ref_no,
                remarks=remarks
            )

        return Response({
            'message': 'Deposit transaction completed successfully.',
            'savings_account': SavingsAccountSerializer(account).data,
            'transaction': DepositTransactionSerializer(txn).data
        })

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
