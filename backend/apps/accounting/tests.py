from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from apps.tenants.models import Tenant
from apps.accounts.models import User, UserRole
from apps.accounting.models import AccountHead, AccountType, JournalEntry, JournalLine


class JournalEntryValidationTests(TestCase):
    """Tests for double-entry validation, line constraints, and balanced journals."""

    def setUp(self):
        self.tenant = Tenant.objects.create(name="Accounting PACS", code="TENANT-ACCT")
        self.accountant = User.objects.create_user(
            username="accountant1", password="Password@123",
            role=UserRole.ACCOUNTANT, tenant=self.tenant
        )
        self.cashier = User.objects.create_user(
            username="cashier_acct", password="Password@123",
            role=UserRole.CASHIER, tenant=self.tenant
        )
        # Create two account heads for double-entry
        self.cash_account = AccountHead.objects.create(
            tenant=self.tenant, code="1001", name="Cash in Hand", type=AccountType.ASSET
        )
        self.capital_account = AccountHead.objects.create(
            tenant=self.tenant, code="3001", name="Share Capital", type=AccountType.EQUITY
        )
        self.client = APIClient()

    def test_balanced_journal_entry_succeeds(self):
        """A balanced journal entry (Debit == Credit) must be accepted."""
        self.client.force_authenticate(user=self.accountant)
        response = self.client.post('/api/v1/accounting/entries/', {
            "narration": "Share capital received",
            "lines": [
                {"account_head_id": str(self.cash_account.id), "debit": "5000.00", "credit": "0.00"},
                {"account_head_id": str(self.capital_account.id), "debit": "0.00", "credit": "5000.00"},
            ]
        }, format='json')
        self.assertEqual(response.status_code, 201)
        je = JournalEntry.objects.get(id=response.data['id'])
        self.assertEqual(je.lines.count(), 2)

    def test_unbalanced_journal_entry_rejected(self):
        """An unbalanced journal entry (Debit ≠ Credit) must be rejected."""
        self.client.force_authenticate(user=self.accountant)
        response = self.client.post('/api/v1/accounting/entries/', {
            "narration": "Unbalanced entry test",
            "lines": [
                {"account_head_id": str(self.cash_account.id), "debit": "5000.00", "credit": "0.00"},
                {"account_head_id": str(self.capital_account.id), "debit": "0.00", "credit": "3000.00"},
            ]
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_single_line_journal_entry_rejected(self):
        """A journal entry with fewer than 2 lines must be rejected."""
        self.client.force_authenticate(user=self.accountant)
        response = self.client.post('/api/v1/accounting/entries/', {
            "narration": "Single line entry",
            "lines": [
                {"account_head_id": str(self.cash_account.id), "debit": "5000.00", "credit": "0.00"},
            ]
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_line_with_both_debit_and_credit_rejected(self):
        """A journal line with both debit > 0 and credit > 0 must be rejected."""
        self.client.force_authenticate(user=self.accountant)
        response = self.client.post('/api/v1/accounting/entries/', {
            "narration": "Both debit and credit on same line",
            "lines": [
                {"account_head_id": str(self.cash_account.id), "debit": "5000.00", "credit": "5000.00"},
                {"account_head_id": str(self.capital_account.id), "debit": "0.00", "credit": "5000.00"},
            ]
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_cashier_cannot_post_manual_journal_entry(self):
        """Only Accountants/Admins can post manual journal entries."""
        self.client.force_authenticate(user=self.cashier)
        response = self.client.post('/api/v1/accounting/entries/', {
            "narration": "Unauthorized manual entry",
            "lines": [
                {"account_head_id": str(self.cash_account.id), "debit": "1000.00", "credit": "0.00"},
                {"account_head_id": str(self.capital_account.id), "debit": "0.00", "credit": "1000.00"},
            ]
        }, format='json')
        self.assertEqual(response.status_code, 403)

    def test_cross_tenant_account_head_rejected(self):
        """Posting a journal entry using another tenant's account head must be rejected."""
        other_tenant = Tenant.objects.create(name="Other PACS", code="TENANT-OTHER-ACCT")
        other_head = AccountHead.objects.create(
            tenant=other_tenant, code="1001", name="Cash in Hand", type=AccountType.ASSET
        )
        self.client.force_authenticate(user=self.accountant)
        response = self.client.post('/api/v1/accounting/entries/', {
            "narration": "Cross-tenant entry",
            "lines": [
                {"account_head_id": str(other_head.id), "debit": "5000.00", "credit": "0.00"},
                {"account_head_id": str(self.capital_account.id), "debit": "0.00", "credit": "5000.00"},
            ]
        }, format='json')
        self.assertEqual(response.status_code, 400)


class TrialBalanceTests(TestCase):
    """Tests for the trial balance calculation endpoint."""

    def setUp(self):
        self.tenant = Tenant.objects.create(name="Trial Balance PACS", code="TENANT-TB")
        self.accountant = User.objects.create_user(
            username="acct_tb", password="Password@123",
            role=UserRole.ACCOUNTANT, tenant=self.tenant
        )
        self.cash_head = AccountHead.objects.create(
            tenant=self.tenant, code="1001", name="Cash", type=AccountType.ASSET
        )
        self.capital_head = AccountHead.objects.create(
            tenant=self.tenant, code="3001", name="Capital", type=AccountType.EQUITY
        )
        # Manually create a balanced journal entry
        je = JournalEntry.objects.create(
            tenant=self.tenant, entry_number="JE-TEST-001",
            narration="Initial capital deposit", posted_by=self.accountant
        )
        JournalLine.objects.create(
            tenant=self.tenant, journal_entry=je,
            account_head=self.cash_head, debit=Decimal('10000.00'), credit=Decimal('0.00')
        )
        JournalLine.objects.create(
            tenant=self.tenant, journal_entry=je,
            account_head=self.capital_head, debit=Decimal('0.00'), credit=Decimal('10000.00')
        )
        self.client = APIClient()

    def test_trial_balance_returns_balanced_result(self):
        """Trial balance totals must be equal (is_balanced = True)."""
        self.client.force_authenticate(user=self.accountant)
        response = self.client.get('/api/v1/accounting/entries/trial-balance/')
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertTrue(data['is_balanced'])
        self.assertEqual(Decimal(str(data['grand_debit'])), Decimal(str(data['grand_credit'])))
