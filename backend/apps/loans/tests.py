from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from apps.tenants.models import Tenant
from apps.accounts.models import User, UserRole
from apps.members.models import Member
from apps.loans.models import (
    LoanProduct, LoanApplication, LoanAccount, LoanRepayment, LoanRepaymentSchedule,
    LoanApplicationStatus, LoanAccountStatus, ScheduleStatus
)
from apps.accounting.models import JournalEntry, JournalLine
from apps.audit.models import AuditLog

class LoanLifecycleAndWaterfallTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tenant = Tenant.objects.create(name="Mandya PACS", code="TENANT-LOAN")
        self.officer = User.objects.create_user(
            username="loan_officer_test", password="Password@123", role=UserRole.LOAN_OFFICER, tenant=self.tenant
        )
        self.admin = User.objects.create_user(
            username="pkps_admin_test", password="Password@123", role=UserRole.PKPS_ADMIN, tenant=self.tenant
        )
        self.member = Member.objects.create(
            tenant=self.tenant, member_number="M-LN-200", first_name="Suresh", village="Mandya", mobile="9876599999"
        )
        self.product = LoanProduct.objects.create(
            tenant=self.tenant, code="CROP-12M", name="Kharif Crop Loan", interest_rate_pa=Decimal('10.00'), tenure_months=12
        )

    def test_full_loan_lifecycle_disbursement_and_schedule_generation(self):
        self.client.force_authenticate(user=self.admin)

        # 1. Create Application
        app = LoanApplication.objects.create(
            tenant=self.tenant, member=self.member, loan_product=self.product,
            application_number="LA-2026-999", requested_amount=Decimal('120000.00'), purpose="Paddy input"
        )

        # 2. Approve
        res_appr = self.client.post(f'/api/v1/loans/applications/{app.id}/approve/', {'approved_amount': 120000.00})
        self.assertEqual(res_appr.status_code, status.HTTP_200_OK)

        # 3. Disburse
        res_disb = self.client.post(f'/api/v1/loans/applications/{app.id}/disburse/')
        self.assertEqual(res_disb.status_code, status.HTTP_200_OK)

        # Verify Loan Account & Repayment Schedule (12 installments created)
        loan_acc = LoanAccount.objects.get(application=app)
        self.assertEqual(loan_acc.outstanding_principal, Decimal('120000.00'))
        
        schedules = LoanRepaymentSchedule.objects.filter(loan_account=loan_acc)
        self.assertEqual(schedules.count(), 12)

        # Verify Disbursement Accounting Journal (Debit Loans Outstanding / Credit Cash)
        journal = JournalEntry.objects.filter(tenant=self.tenant).latest('created_at')
        lines = list(JournalLine.objects.filter(journal_entry=journal))
        self.assertEqual(len(lines), 2)
        self.assertEqual(lines[0].debit + lines[1].debit, Decimal('120000.00'))

    def test_waterfall_loan_repayment_and_overpayment_excess_credit(self):
        self.client.force_authenticate(user=self.admin)

        app = LoanApplication.objects.create(
            tenant=self.tenant, member=self.member, loan_product=self.product,
            application_number="LA-WATERFALL-01", requested_amount=Decimal('10000.00'), purpose="Seeds",
            status=LoanApplicationStatus.APPROVED
        )

        self.client.post(f'/api/v1/loans/applications/{app.id}/disburse/')
        loan_acc = LoanAccount.objects.get(application=app)

        # Set specific outstanding amounts for testing
        loan_acc.outstanding_principal = Decimal('40000.00')
        loan_acc.outstanding_interest = Decimal('1500.00')
        loan_acc.save()

        # Repay ₹50,000 (Overpayment: ₹1,500 interest + ₹40,000 principal + ₹8,500 excess)
        res_repay = self.client.post(f'/api/v1/loans/accounts/{loan_acc.id}/repay/', {
            'amount': 50000.00,
            'payment_mode': 'BANK_TRANSFER'
        })
        self.assertEqual(res_repay.status_code, status.HTTP_200_OK)

        loan_acc.refresh_from_db()
        self.assertEqual(loan_acc.outstanding_principal, Decimal('0.00'))
        self.assertEqual(loan_acc.outstanding_interest, Decimal('0.00'))
        self.assertEqual(loan_acc.excess_credit, Decimal('8500.00')) # Excess tracked cleanly!
        self.assertEqual(loan_acc.loan_status, LoanAccountStatus.CLOSED)

        # Verify LoanRepayment record components
        repayment = LoanRepayment.objects.get(loan_account=loan_acc)
        self.assertEqual(repayment.interest_component, Decimal('1500.00'))
        self.assertEqual(repayment.principal_component, Decimal('40000.00'))
        self.assertEqual(repayment.excess_component, Decimal('8500.00'))
        self.assertEqual(repayment.total_paid, Decimal('50000.00'))
