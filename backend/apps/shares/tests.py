from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from apps.tenants.models import Tenant
from apps.accounts.models import User, UserRole
from apps.members.models import Member
from apps.shares.models import ShareAccount, ShareTransaction


class ShareTransactionTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name="Mandya PKPS", code="TENANT-SHARES")
        self.cashier = User.objects.create_user(
            username="cashier_shares", password="Password@123",
            role=UserRole.CASHIER, tenant=self.tenant
        )
        self.farmer = User.objects.create_user(
            username="farmer_shares", password="Password@123",
            role=UserRole.FARMER, tenant=self.tenant
        )
        self.member = Member.objects.create(
            tenant=self.tenant, member_number="M-SHR-001",
            first_name="Rekha", village="Holenarsipur", mobile="9876511111"
        )
        self.share_account = ShareAccount.objects.create(
            tenant=self.tenant, member=self.member,
            total_shares=0, total_amount=Decimal('0.00')
        )
        self.client = APIClient()

    def test_share_purchase_by_cashier(self):
        """Cashier can purchase shares for a member."""
        self.client.force_authenticate(user=self.cashier)
        response = self.client.post(
            f'/api/v1/shares/accounts/{self.share_account.id}/transact/',
            {'transaction_type': 'DEPOSIT', 'number_of_shares': 10}
        )
        self.assertEqual(response.status_code, 200)
        self.share_account.refresh_from_db()
        self.assertEqual(self.share_account.total_shares, 10)
        self.assertEqual(self.share_account.total_amount, Decimal('1000.00'))  # 10 * 100

    def test_share_redemption_reduces_shares(self):
        """Redeeming shares correctly reduces total_shares and total_amount."""
        self.share_account.total_shares = 20
        self.share_account.total_amount = Decimal('2000.00')
        self.share_account.save()

        self.client.force_authenticate(user=self.cashier)
        response = self.client.post(
            f'/api/v1/shares/accounts/{self.share_account.id}/transact/',
            {'transaction_type': 'WITHDRAWAL', 'number_of_shares': 5}
        )
        self.assertEqual(response.status_code, 200)
        self.share_account.refresh_from_db()
        self.assertEqual(self.share_account.total_shares, 15)
        self.assertEqual(self.share_account.total_amount, Decimal('1500.00'))

    def test_share_redemption_exceeding_balance_rejected(self):
        """Redeeming more shares than balance must be rejected."""
        self.share_account.total_shares = 5
        self.share_account.total_amount = Decimal('500.00')
        self.share_account.save()

        self.client.force_authenticate(user=self.cashier)
        response = self.client.post(
            f'/api/v1/shares/accounts/{self.share_account.id}/transact/',
            {'transaction_type': 'WITHDRAWAL', 'number_of_shares': 10}
        )
        self.assertEqual(response.status_code, 400)
        self.share_account.refresh_from_db()
        self.assertEqual(self.share_account.total_shares, 5)

    def test_farmer_cannot_transact_on_other_member_share_account(self):
        """Farmers must not be able to transact on another member's share account."""
        self.client.force_authenticate(user=self.farmer)
        response = self.client.post(
            f'/api/v1/shares/accounts/{self.share_account.id}/transact/',
            {'transaction_type': 'DEPOSIT', 'number_of_shares': 5}
        )
        self.assertIn(response.status_code, [403, 401, 404])

    def test_farmer_cannot_liquidate_shares_directly(self):
        """Farmers cannot withdraw/liquidate shares directly; must apply to PKPS Board."""
        self.member.user = self.farmer
        self.member.save()
        self.client.force_authenticate(user=self.farmer)
        response = self.client.post(
            f'/api/v1/shares/accounts/{self.share_account.id}/transact/',
            {'transaction_type': 'WITHDRAWAL', 'number_of_shares': 1}
        )
        self.assertEqual(response.status_code, 403)

    def test_share_transaction_log_is_read_only(self):
        """ShareTransactionViewSet must not allow direct POST (write) by staff."""
        self.client.force_authenticate(user=self.cashier)
        response = self.client.post('/api/v1/shares/transactions/', {
            'share_account': str(self.share_account.id),
            'transaction_type': 'DEPOSIT',
            'number_of_shares': 5,
            'amount': '500.00',
            'reference_number': 'MANUAL-001'
        })
        # Read-only viewset should return 405 Method Not Allowed
        self.assertEqual(response.status_code, 405)


class ShareAccountRBACTests(TestCase):
    def setUp(self):
        self.tenant_a = Tenant.objects.create(name="PACS A", code="TENANT-A-SHR")
        self.tenant_b = Tenant.objects.create(name="PACS B", code="TENANT-B-SHR")
        self.cashier_a = User.objects.create_user(
            username="cashier_a_shr", password="Password@123",
            role=UserRole.CASHIER, tenant=self.tenant_a
        )
        self.member_b = Member.objects.create(
            tenant=self.tenant_b, member_number="M-B-SHR-001",
            first_name="Manjunath", village="Mysuru", mobile="9876522222"
        )
        self.share_account_b = ShareAccount.objects.create(
            tenant=self.tenant_b, member=self.member_b,
            total_shares=10, total_amount=Decimal('1000.00')
        )
        self.client = APIClient()

    def test_cross_tenant_share_transaction_blocked(self):
        """Cashier from Tenant A cannot transact on Tenant B's share account."""
        self.client.force_authenticate(user=self.cashier_a)
        response = self.client.post(
            f'/api/v1/shares/accounts/{self.share_account_b.id}/transact/',
            {'transaction_type': 'WITHDRAWAL', 'number_of_shares': 2}
        )
        self.assertIn(response.status_code, [403, 404])
