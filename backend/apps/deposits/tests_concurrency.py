import threading
from unittest import skipIf
from django.db import connection
from django.test import TransactionTestCase
from decimal import Decimal
from apps.tenants.models import Tenant
from apps.accounts.models import User, UserRole
from apps.members.models import Member
from apps.deposits.models import SavingsAccount, DepositTransaction

class SavingsConcurrencyTests(TransactionTestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name="Mandya PACS", code="TENANT-CONCUR")
        self.staff = User.objects.create_user(
            username="cashier_concur", password="Password@123", role=UserRole.CASHIER, tenant=self.tenant
        )
        self.member = Member.objects.create(
            tenant=self.tenant, member_number="M-CON-001", first_name="Ramesh", village="Mandya", mobile="9876598765"
        )
        # Account starts with ₹5,000 balance
        self.account = SavingsAccount.objects.create(
            tenant=self.tenant, member=self.member, account_number="SB-CON-001", current_balance=Decimal('5000.00')
        )

    @skipIf(connection.vendor == 'sqlite', "SQLite locks the database file on concurrent threads during select_for_update()")
    def test_concurrent_withdrawals_prevent_double_spending(self):
        """
        Simulate 2 concurrent threads trying to withdraw ₹5,000 simultaneously
        from an account containing only ₹5,000 balance.
        Only 1 withdrawal must succeed; the other must fail due to row locking / balance check.
        """
        results = []

        def perform_withdrawal():
            from rest_framework.test import APIClient
            client = APIClient()
            client.force_authenticate(user=self.staff)
            res = client.post(f'/api/v1/deposits/savings/{self.account.id}/transact/', {
                'transaction_type': 'WITHDRAWAL',
                'amount': 5000.00
            })
            results.append(res.status_code)

        t1 = threading.Thread(target=perform_withdrawal)
        t2 = threading.Thread(target=perform_withdrawal)

        t1.start()
        t2.start()

        t1.join()
        t2.join()

        # One request must get 200 OK, the other must fail with 400 Bad Request
        self.assertIn(200, results)
        self.assertIn(400, results)

        self.account.refresh_from_db()
        # Balance must equal 0.00 (not negative -5000.00)
        self.assertEqual(self.account.current_balance, Decimal('0.00'))
