import uuid
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import LoanProduct, LoanApplication, LoanAccount, LoanRepayment, LoanApplicationStatus, LoanAccountStatus
from .serializers import (
    LoanProductSerializer, LoanApplicationSerializer, CreateLoanApplicationSerializer,
    LoanAccountSerializer, LoanRepaymentSerializer
)
from apps.tenants.permissions import EnforceTenantIsolation

class LoanProductViewSet(viewsets.ModelViewSet):
    queryset = LoanProduct.objects.all()
    serializer_class = LoanProductSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return LoanProduct.objects.all()
        if user.tenant:
            return LoanProduct.objects.filter(tenant=user.tenant)
        return LoanProduct.objects.none()

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

class LoanApplicationViewSet(viewsets.ModelViewSet):
    queryset = LoanApplication.objects.all()
    serializer_class = LoanApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateLoanApplicationSerializer
        return LoanApplicationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return LoanApplication.objects.all()
        if user.role == 'FARMER':
            return LoanApplication.objects.filter(member__user=user, tenant=user.tenant)
        if user.tenant:
            return LoanApplication.objects.filter(tenant=user.tenant)
        return LoanApplication.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        member = serializer.validated_data.get('member')
        if not member:
            member = Member.objects.filter(user=user).first()
            if not member:
                raise serializers.ValidationError({'detail': 'Your account is not a verified society member yet. Please apply for membership first.'})

        tenant = user.tenant or member.tenant
        app_num = f"LA-{timezone.now().year}-{uuid.uuid4().hex[:6].upper()}"
        serializer.save(
            tenant=tenant,
            member=member,
            application_number=app_num,
            status=LoanApplicationStatus.SUBMITTED
        )


    @action(detail=True, methods=['post'], url_path='verify')
    def verify(self, request, pk=None):
        app = self.get_object()
        app.status = LoanApplicationStatus.UNDER_ASSESSMENT
        app.verified_by = request.user
        app.verified_date = timezone.now()
        app.save()
        return Response({'message': 'Loan application verified.', 'application': LoanApplicationSerializer(app).data})

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        app = self.get_object()
        approved_amt = Decimal(request.data.get('approved_amount', app.requested_amount))
        
        app.status = LoanApplicationStatus.APPROVED
        app.approved_by = request.user
        app.approved_amount = approved_amt
        app.approved_date = timezone.now()
        app.save()
        return Response({'message': 'Loan application approved.', 'application': LoanApplicationSerializer(app).data})

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        app = self.get_object()
        reason = request.data.get('reason', 'Application rejected during review.')
        app.status = LoanApplicationStatus.REJECTED
        app.rejection_reason = reason
        app.save()
        return Response({'message': 'Loan application rejected.', 'application': LoanApplicationSerializer(app).data})

    @action(detail=True, methods=['post'], url_path='disburse')
    def disburse(self, request, pk=None):
        app = self.get_object()
        if app.status != LoanApplicationStatus.APPROVED:
            return Response({'detail': 'Only approved applications can be disbursed.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            app.status = LoanApplicationStatus.DISBURSED
            app.save()

            acc_num = f"LN-{uuid.uuid4().hex[:8].upper()}"
            sanctioned = app.approved_amount or app.requested_amount
            due_date = timezone.now().date() + timedelta(days=365)

            loan_acc = LoanAccount.objects.create(
                tenant=app.tenant,
                member=app.member,
                application=app,
                account_number=acc_num,
                sanctioned_amount=sanctioned,
                disbursed_amount=sanctioned,
                interest_rate_pa=app.loan_product.interest_rate_pa,
                outstanding_principal=sanctioned,
                outstanding_interest=0.00,
                loan_status=LoanAccountStatus.CURRENT,
                next_due_date=due_date
            )

        return Response({
            'message': 'Loan disbursed and account created successfully.',
            'loan_account': LoanAccountSerializer(loan_acc).data
        })

class LoanAccountViewSet(viewsets.ModelViewSet):
    queryset = LoanAccount.objects.all()
    serializer_class = LoanAccountSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return LoanAccount.objects.all()
        if user.role == 'FARMER':
            return LoanAccount.objects.filter(member__user=user, tenant=user.tenant)
        if user.tenant:
            return LoanAccount.objects.filter(tenant=user.tenant)
        return LoanAccount.objects.none()

    @action(detail=True, methods=['post'], url_path='repay')
    def repay(self, request, pk=None):
        account = self.get_object()
        amount = Decimal(request.data.get('amount', 0))
        payment_mode = request.data.get('payment_mode', 'CASH')

        if amount <= 0:
            return Response({'detail': 'Repayment amount must be positive.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Basic allocation: interest first, then principal
            interest_due = account.outstanding_interest
            interest_paid = min(amount, interest_due)
            remaining_for_principal = amount - interest_paid
            principal_paid = min(remaining_for_principal, account.outstanding_principal)

            account.outstanding_interest -= interest_paid
            account.outstanding_principal -= principal_paid

            if account.outstanding_principal <= 0:
                account.loan_status = LoanAccountStatus.CLOSED

            account.save()

            rec_num = f"REC-LN-{uuid.uuid4().hex[:8].upper()}"
            repayment = LoanRepayment.objects.create(
                tenant=account.tenant,
                loan_account=account,
                member=account.member,
                receipt_number=rec_num,
                total_paid=amount,
                principal_component=principal_paid,
                interest_component=interest_paid,
                penalty_component=0.00,
                payment_mode=payment_mode,
                collected_by=request.user
            )

        return Response({
            'message': 'Repayment processed successfully.',
            'loan_account': LoanAccountSerializer(account).data,
            'repayment': LoanRepaymentSerializer(repayment).data
        })
