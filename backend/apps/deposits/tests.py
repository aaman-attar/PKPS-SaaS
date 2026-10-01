from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from apps.tenants.models import Tenant
from apps.accounts.models import User, UserRole
from apps.members.models import Member
from apps.deposits.models import SavingsAccount, DepositTransaction
from apps.accounting.models import JournalEntry, JournalLine
from apps.audit.models import AuditLog

class FourWaySavingsReconciliationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tenant = Tenant.objects.create(name="Mandya PACS", code="TENANT-SAV")
        self.staff = User.objects.create_user(
            username="cashier_user", password="Password@123", role=UserRole.CASHIER, tenant=self.tenant
        )
        self.member = Member.objects.create(
            tenant=self.tenant, member_number="M-SAV-100", first_name="Ramesh", village="Mandya", mobile="9876500001"
        )
        self.account = SavingsAccount.objects.create(
            tenant=self.tenant, member=self.member, account_number="SB-100", current_balance=Decimal('5000.00')
        )

    def test_four_way_reconciliation_on_savings_deposit(self):
        self.client.force_authenticate(user=self.staff)

        res = self.client.post(f'/api/v1/deposits/savings/{self.account.id}/transact/', {
            'transaction_type': 'DEPOSIT',
            'amount': 10000.00,
            'remarks': 'Fertilizer sale proceeds'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # 1. Balance Verification (+10,000)
        self.account.refresh_from_db()
        self.assertEqual(self.account.current_balance, Decimal('15000.00'))

        # 2. Deposit Transaction Record Verification
        txn = DepositTransaction.objects.get(savings_account=self.account, transaction_type='DEPOSIT')
        self.assertEqual(txn.amount, Decimal('10000.00'))
        self.assertEqual(txn.balance_after, Decimal('15000.00'))

        # 3. Double-Entry Accounting Journal Verification (Debit = Credit = 10,000)
        journal = JournalEntry.objects.filter(tenant=self.tenant).latest('created_at')
        lines = list(JournalLine.objects.filter(journal_entry=journal))
        self.assertEqual(len(lines), 2)
        debit_total = sum([l.debit for l in lines])
        credit_total = sum([l.credit for l in lines])
        self.assertEqual(debit_total, Decimal('10000.00'))
        self.assertEqual(credit_total, Decimal('10000.00'))
        self.assertEqual(debit_total, credit_total)

        # 4. Audit Log Entry Verification
        audit = AuditLog.objects.filter(tenant=self.tenant, action='SAVINGS_DEPOSIT').first()
        self.assertIsNotNone(audit)
        self.assertEqual(str(audit.entity_id), str(self.account.id))
        self.assertEqual(audit.user, self.staff)

    def test_withdrawal_insufficient_balance_rejection(self):
        self.client.force_authenticate(user=self.staff)

        res = self.client.post(f'/api/v1/deposits/savings/{self.account.id}/transact/', {
            'transaction_type': 'WITHDRAWAL',
            'amount': 20000.00 # Balance is only 5,000
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Balance remains unchanged
        self.account.refresh_from_db()
        self.assertEqual(self.account.current_balance, Decimal('5000.00'))
