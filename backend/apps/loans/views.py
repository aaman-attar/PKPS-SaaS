import uuid
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .models import (
    LoanProduct, LoanApplication, LoanAccount, LoanRepayment, LoanRepaymentSchedule,
    LoanApplicationStatus, LoanAccountStatus, ScheduleStatus
)
from .serializers import (
    LoanProductSerializer, LoanApplicationSerializer, CreateLoanApplicationSerializer,
    LoanAccountSerializer, LoanRepaymentSerializer, LoanRepaymentScheduleSerializer
)
from apps.tenants.permissions import EnforceTenantIsolation, validate_tenant_object
from apps.members.models import Member
from apps.accounting.services import post_loan_disbursement_journal, post_loan_repayment_journal
from apps.audit.services import record_audit

from .services import seed_default_loan_products

class LoanProductViewSet(viewsets.ModelViewSet):
    queryset = LoanProduct.objects.all()
    serializer_class = LoanProductSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return LoanProduct.objects.all()

        target_tenant = user.tenant
        if not target_tenant and user.role == 'FARMER':
            member = Member.objects.filter(user=user).first()
            if member and member.tenant:
                target_tenant = member.tenant
                user.tenant = target_tenant
                user.save(update_fields=['tenant'])

        if target_tenant:
            # If no products exist yet for this tenant, seed default standard PKPS products
            if not LoanProduct.objects.filter(tenant=target_tenant).exists():
                seed_default_loan_products(target_tenant)
            return LoanProduct.objects.filter(tenant=target_tenant, is_active=True)

        return LoanProduct.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'PKPS_ADMIN', 'SECRETARY', 'LOAN_OFFICER']:
            raise PermissionDenied("Permission denied to create loan products.")
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
            return LoanApplication.objects.filter(member__user=user)
        if user.tenant:
            return LoanApplication.objects.filter(tenant=user.tenant)
        return LoanApplication.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        member = serializer.validated_data.get('member')

        if user.role == 'FARMER':
            member = Member.objects.filter(user=user).first()
            if not member:
                raise PermissionDenied("Your account is not a verified society member yet.")
            if not user.tenant and member.tenant:
                user.tenant = member.tenant
                user.save(update_fields=['tenant'])

        if not member:
            raise PermissionDenied("A valid member profile must be specified.")

        tenant = user.tenant or member.tenant

        # Validate tenant match
        if member.tenant != tenant and user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            raise PermissionDenied("Cross-tenant member selection rejected.")

        product = serializer.validated_data.get('loan_product')
        if product.tenant != tenant and user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            raise PermissionDenied("Cross-tenant loan product selection rejected.")

        app_num = f"LA-{timezone.now().year}-{uuid.uuid4().hex[:6].upper()}"
        app = serializer.save(
            tenant=tenant,
            member=member,
            application_number=app_num,
            status=LoanApplicationStatus.SUBMITTED
        )
        record_audit(user, 'CREATE_LOAN_APPLICATION', 'LOANS', 'LoanApplication', app.id)

    @action(detail=True, methods=['post'], url_path='verify')
    def verify(self, request, pk=None):
        if request.user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'PKPS_ADMIN', 'SECRETARY', 'LOAN_OFFICER', 'MANAGER']:
            raise PermissionDenied("Permission denied to verify loan application.")

        app = self.get_object()
        validate_tenant_object(app, request.user)

        app.status = LoanApplicationStatus.UNDER_ASSESSMENT
        app.verified_by = request.user
        app.verified_date = timezone.now()
        app.save()

        record_audit(request.user, 'VERIFY_LOAN_APPLICATION', 'LOANS', 'LoanApplication', app.id)
        return Response({'message': 'Loan application verified.', 'application': LoanApplicationSerializer(app).data})

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        if request.user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'PKPS_ADMIN', 'SECRETARY', 'MANAGER']:
            raise PermissionDenied("Permission denied to approve loan application.")

        app = self.get_object()
        validate_tenant_object(app, request.user)

        try:
            approved_amt = Decimal(str(request.data.get('approved_amount', app.requested_amount)))
        except Exception:
            return Response({'detail': 'Invalid approved amount.'}, status=status.HTTP_400_BAD_REQUEST)

        prod = app.loan_product
        if approved_amt <= 0 or approved_amt < prod.min_amount or approved_amt > prod.max_amount:
            return Response({'detail': f'Approved amount must be between ₹{prod.min_amount} and ₹{prod.max_amount}.'}, status=status.HTTP_400_BAD_REQUEST)

        app.status = LoanApplicationStatus.APPROVED
        app.approved_by = request.user
        app.approved_amount = approved_amt
        app.approved_date = timezone.now()
        app.save()

        record_audit(request.user, 'APPROVE_LOAN_APPLICATION', 'LOANS', 'LoanApplication', app.id)
        return Response({'message': 'Loan application approved.', 'application': LoanApplicationSerializer(app).data})

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        if request.user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'PKPS_ADMIN', 'SECRETARY', 'MANAGER', 'LOAN_OFFICER']:
            raise PermissionDenied("Permission denied to reject loan application.")

        app = self.get_object()
        validate_tenant_object(app, request.user)

        reason = request.data.get('reason', 'Application rejected during review.')
        app.status = LoanApplicationStatus.REJECTED
        app.rejection_reason = reason
        app.save()

        record_audit(request.user, 'REJECT_LOAN_APPLICATION', 'LOANS', 'LoanApplication', app.id)
        return Response({'message': 'Loan application rejected.', 'application': LoanApplicationSerializer(app).data})

    @action(detail=True, methods=['post'], url_path='disburse')
    def disburse(self, request, pk=None):
        if request.user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'PKPS_ADMIN', 'SECRETARY', 'MANAGER', 'CASHIER']:
            raise PermissionDenied("Permission denied to disburse loan.")

        with transaction.atomic():
            # Lock loan application during disbursement
            app = LoanApplication.objects.select_for_update().get(pk=self.get_object().pk)
            validate_tenant_object(app, request.user)

            if app.status != LoanApplicationStatus.APPROVED:
                return Response({'detail': 'Only approved applications can be disbursed.'}, status=status.HTTP_400_BAD_REQUEST)

            app.status = LoanApplicationStatus.DISBURSED
            app.save()

            acc_num = f"LN-{uuid.uuid4().hex[:8].upper()}"
            sanctioned = app.approved_amount or app.requested_amount
            tenure_m = app.loan_product.tenure_months or 12
            rate_pa = app.loan_product.interest_rate_pa

            due_date = timezone.now().date() + timedelta(days=30)

            # Interest calculation
            total_interest = round((sanctioned * rate_pa * Decimal(str(tenure_m / 12))) / Decimal('100.00'), 2)
            principal_per_month = round(sanctioned / Decimal(str(tenure_m)), 2)
            interest_per_month = round(total_interest / Decimal(str(tenure_m)), 2)

            loan_acc = LoanAccount.objects.create(
                tenant=app.tenant,
                member=app.member,
                application=app,
                account_number=acc_num,
                sanctioned_amount=sanctioned,
                disbursed_amount=sanctioned,
                interest_rate_pa=rate_pa,
                outstanding_principal=sanctioned,
                outstanding_interest=total_interest,
                loan_status=LoanAccountStatus.CURRENT,
                next_due_date=due_date
            )

            # Generate monthly Repayment Schedule with rounding adjustment on final installment
            start_date = timezone.now().date()
            accum_principal = Decimal('0.00')
            accum_interest = Decimal('0.00')

            for i in range(1, tenure_m + 1):
                inst_due_date = start_date + timedelta(days=30 * i)

                if i == tenure_m:
                    p_due = sanctioned - accum_principal
                    i_due = total_interest - accum_interest
                else:
                    p_due = principal_per_month
                    i_due = interest_per_month

                accum_principal += p_due
                accum_interest += i_due

                LoanRepaymentSchedule.objects.create(
                    tenant=app.tenant,
                    loan_account=loan_acc,
                    installment_number=i,
                    due_date=inst_due_date,
                    principal_due=p_due,
                    interest_due=i_due,
                    total_due=p_due + i_due,
                    status=ScheduleStatus.PENDING
                )

            # Post double-entry accounting journal
            post_loan_disbursement_journal(app.tenant, request.user, app.member, loan_acc.account_number, sanctioned)
            record_audit(request.user, 'DISBURSE_LOAN', 'LOANS', 'LoanAccount', loan_acc.id)

        return Response({
            'message': 'Loan disbursed, account activated, and repayment schedule generated successfully.',
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
        if request.user.role in ['FARMER', 'AUDITOR']:
            raise PermissionDenied("Unauthorized to collect loan repayments.")

        account_obj = self.get_object()
        validate_tenant_object(account_obj, request.user)

        try:
            amount = Decimal(str(request.data.get('amount', 0)))
        except Exception:
            return Response({'detail': 'Invalid decimal repayment amount.'}, status=status.HTTP_400_BAD_REQUEST)

        payment_mode = request.data.get('payment_mode', 'CASH')
        idempotency_key = request.data.get('idempotency_key', '').strip()

        if amount <= 0:
            return Response({'detail': 'Repayment amount must be positive.'}, status=status.HTTP_400_BAD_REQUEST)

        if idempotency_key:
            existing_rep = LoanRepayment.objects.filter(
                tenant=account_obj.tenant, receipt_number=idempotency_key
            ).first()
            if existing_rep:
                return Response({
                    'message': 'Duplicate repayment request skipped (idempotent).',
                    'loan_account': LoanAccountSerializer(account_obj).data,
                    'repayment': LoanRepaymentSerializer(existing_rep).data
                })

        with transaction.atomic():
            account = LoanAccount.objects.select_for_update().get(pk=account_obj.pk)

            remaining = amount

            # 1. Penalty Waterfall Allocation
            penalty_due = account.overdue_amount
            penalty_paid = min(remaining, penalty_due)
            remaining -= penalty_paid

            # 2. Outstanding Interest Waterfall Allocation
            interest_due = account.outstanding_interest
            interest_paid = min(remaining, interest_due)
            remaining -= interest_paid

            # 3. Outstanding Principal Waterfall Allocation
            principal_due = account.outstanding_principal
            principal_paid = min(remaining, principal_due)
            remaining -= principal_paid

            # 4. Excess Credit Allocation
            excess_paid = remaining
            if excess_paid > 0:
                account.excess_credit += excess_paid

            account.overdue_amount -= penalty_paid
            account.outstanding_interest -= interest_paid
            account.outstanding_principal -= principal_paid

            if account.outstanding_principal <= 0:
                account.outstanding_principal = Decimal('0.00')
                account.loan_status = LoanAccountStatus.CLOSED

            account.save()

            # Update repayment schedule installments sequentially
            schedules = LoanRepaymentSchedule.objects.filter(
                loan_account=account, 
                status__in=[ScheduleStatus.PENDING, ScheduleStatus.PARTIALLY_PAID, ScheduleStatus.OVERDUE]
            ).order_by('installment_number')

            rem_p = principal_paid
            rem_i = interest_paid

            for sched in schedules:
                if rem_i > 0:
                    i_needed = sched.interest_due - sched.interest_paid
                    i_alloc = min(rem_i, i_needed)
                    sched.interest_paid += i_alloc
                    rem_i -= i_alloc

                if rem_p > 0:
                    p_needed = sched.principal_due - sched.principal_paid
                    p_alloc = min(rem_p, p_needed)
                    sched.principal_paid += p_alloc
                    rem_p -= p_alloc

                if (sched.principal_paid + sched.interest_paid) >= sched.total_due:
                    sched.status = ScheduleStatus.PAID
                    sched.paid_date = timezone.now().date()
                elif (sched.principal_paid + sched.interest_paid) > 0:
                    sched.status = ScheduleStatus.PARTIALLY_PAID

                sched.save()

            rec_num = idempotency_key if idempotency_key else f"REC-LN-{uuid.uuid4().hex[:8].upper()}"
            repayment = LoanRepayment.objects.create(
                tenant=account.tenant,
                loan_account=account,
                member=account.member,
                receipt_number=rec_num,
                total_paid=amount,
                principal_component=principal_paid,
                interest_component=interest_paid,
                penalty_component=penalty_paid,
                excess_component=excess_paid,
                payment_mode=payment_mode,
                collected_by=request.user
            )

            # Post double-entry accounting journal entries (reconciling excess credit)
            post_loan_repayment_journal(
                account.tenant, request.user, account.member, account.account_number, 
                principal_paid, interest_paid, penalty_paid, excess_paid
            )
            record_audit(request.user, 'LOAN_REPAYMENT', 'LOANS', 'LoanAccount', account.id, new_values={'amount': str(amount)})

        return Response({
            'message': 'Repayment processed successfully.',
            'loan_account': LoanAccountSerializer(account).data,
            'repayment': LoanRepaymentSerializer(repayment).data
        })

class LoanRepaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """Immutable repayment history - read-only for security."""
    queryset = LoanRepayment.objects.all()
    serializer_class = LoanRepaymentSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return LoanRepayment.objects.all()
        if user.role == 'FARMER':
            return LoanRepayment.objects.filter(member__user=user, tenant=user.tenant)
        if user.tenant:
            return LoanRepayment.objects.filter(tenant=user.tenant)
        return LoanRepayment.objects.none()

class LoanRepaymentScheduleViewSet(viewsets.ReadOnlyModelViewSet):
    """Immutable repayment schedule - read-only for security."""
    queryset = LoanRepaymentSchedule.objects.all()
    serializer_class = LoanRepaymentScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return LoanRepaymentSchedule.objects.all()
        if user.role == 'FARMER':
            return LoanRepaymentSchedule.objects.filter(loan_account__member__user=user, tenant=user.tenant)
        if user.tenant:
            return LoanRepaymentSchedule.objects.filter(tenant=user.tenant)
        return LoanRepaymentSchedule.objects.none()
