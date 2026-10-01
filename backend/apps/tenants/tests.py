import hashlib
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.tenants.models import (
    Tenant, TenantStatus, SocietyProfile, SocietyAddress,
    SocietyBankAccount, TenantInvitation, InvitationStatus
)
from apps.accounts.models import User, UserRole
from apps.members.models import Member
from apps.deposits.models import SavingsAccount


class TenantIsolationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Tenant A
        self.tenant_a = Tenant.objects.create(name="Mandya PACS A", code="TENANT-A")
        self.user_a = User.objects.create_user(
            username="user_a", password="Password@123", role=UserRole.PKPS_ADMIN, tenant=self.tenant_a
        )
        self.member_a = Member.objects.create(
            tenant=self.tenant_a, user=self.user_a, member_number="M-A-001",
            first_name="Ramesh", village="Mandya", mobile="9000000001"
        )
        self.savings_a = SavingsAccount.objects.create(
            tenant=self.tenant_a, member=self.member_a, account_number="SB-A-001", current_balance=10000.00
        )

        # Tenant B
        self.tenant_b = Tenant.objects.create(name="Mysore PACS B", code="TENANT-B")
        self.user_b = User.objects.create_user(
            username="user_b", password="Password@123", role=UserRole.PKPS_ADMIN, tenant=self.tenant_b
        )
        self.member_b = Member.objects.create(
            tenant=self.tenant_b, user=self.user_b, member_number="M-B-001",
            first_name="Suresh", village="Mysore", mobile="9000000002"
        )
        self.savings_b = SavingsAccount.objects.create(
            tenant=self.tenant_b, member=self.member_b, account_number="SB-B-001", current_balance=50000.00
        )

    def test_tenant_a_cannot_access_tenant_b_member(self):
        self.client.force_authenticate(user=self.user_a)
        res = self.client.get(f'/api/v1/members/{self.member_b.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_tenant_a_cannot_transact_on_tenant_b_savings(self):
        self.client.force_authenticate(user=self.user_a)
        res = self.client.post(f'/api/v1/deposits/accounts/{self.savings_b.id}/transact/', {
            'transaction_type': 'WITHDRAWAL',
            'amount': 1000.00
        })
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_tenant_a_gets_only_tenant_a_members(self):
        self.client.force_authenticate(user=self.user_a)
        res = self.client.get('/api/v1/members/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        member_ids = [m['id'] for m in results]
        self.assertIn(str(self.member_a.id), member_ids)
        self.assertNotIn(str(self.member_b.id), member_ids)


class PKPSOnboardingLifecycleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Super Admin
        self.super_admin = User.objects.create_superuser(
            username="saas_admin",
            email="saas_admin@pkpscloud.gov.in",
            password="AdminPassword@123",
            role=UserRole.SUPER_ADMIN,
        )

    def test_full_onboarding_to_activation_lifecycle(self):
        self.client.force_authenticate(user=self.super_admin)

        # 1. SaaS Admin registers new PKPS society via Onboarding API
        onboard_payload = {
            "name": "Maddur Taluk PACS Limited",
            "code": "PKPS-MADDUR-901",
            "society_type": "PACS",
            "subscription_plan": "STANDARD",
            "registration_number": "AR-44/MDR/2026",
            "registration_authority": "Registrar of Cooperative Societies",
            "state": "Karnataka",
            "district": "Mandya",
            "taluk": "Maddur",
            "area_of_operation": "TALUK",
            "address_line_1": "Station Road",
            "village_town": "Maddur",
            "pin_code": "571428",
            "official_mobile": "9845011223",
            "bank_accounts": [
                {
                    "bank_type": "DCCB",
                    "bank_name": "Mandya DCCB Bank",
                    "branch_name": "Maddur Branch",
                    "account_number": "998877665544",
                    "ifsc_code": "MDCC0001001",
                    "account_type": "CURRENT",
                    "is_primary": True
                }
            ],
            "auth_full_name": "Nagaraj Gowda",
            "auth_designation": "President",
            "auth_mobile": "9845033445",
            "admin_full_name": "Shankar Murthy",
            "admin_designation": "CEO / Secretary",
            "admin_mobile": "9845077889",
            "admin_email": "shankar.ceo@maddurpacs.coop"
        }

        res = self.client.post('/api/v1/tenants/onboard/', onboard_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertIn('dev_activation_link', res.data)
        activation_link = res.data['dev_activation_link']
        self.assertIn('token=', activation_link)

        # Extract raw token
        token_part = activation_link.split('token=')[1].split('&')[0]

        # Verify Tenant and Admin user created
        tenant = Tenant.objects.get(code="PKPS-MADDUR-901")
        self.assertEqual(tenant.name, "Maddur Taluk PACS Limited")
        self.assertEqual(tenant.status, TenantStatus.APPROVED)

        admin_user = User.objects.get(email="shankar.ceo@maddurpacs.coop")
        self.assertEqual(admin_user.role, UserRole.PKPS_ADMIN)
        self.assertEqual(admin_user.tenant, tenant)
        self.assertFalse(admin_user.is_active)  # Inactive until activation

        # 2. Public / Anonymous PKPS Admin validates invitation token
        anon_client = APIClient()
        val_res = anon_client.get(f'/api/v1/tenants/invitation/?token={token_part}')
        self.assertEqual(val_res.status_code, status.HTTP_200_OK)
        self.assertTrue(val_res.data['valid'])
        self.assertEqual(val_res.data['tenant_code'], "PKPS-MADDUR-901")
        self.assertEqual(val_res.data['email'], "shankar.ceo@maddurpacs.coop")

        # 3. PKPS Admin submits password to activate account
        act_res = anon_client.post('/api/v1/tenants/activate/', {
            'token': token_part,
            'password': 'PkpsSecret@2026',
            'confirm_password': 'PkpsSecret@2026'
        })
        self.assertEqual(act_res.status_code, status.HTTP_200_OK, act_res.data)

        # 4. Verify user and tenant are active
        admin_user.refresh_from_db()
        tenant.refresh_from_db()
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.check_password('PkpsSecret@2026'))
        self.assertEqual(tenant.status, TenantStatus.ACTIVE)

        # Invitation is accepted
        token_hash = hashlib.sha256(token_part.encode()).hexdigest()
        inv = TenantInvitation.objects.get(token_hash=token_hash)
        self.assertEqual(inv.status, InvitationStatus.ACCEPTED)

    def test_duplicate_registration_number_rejected(self):
        self.client.force_authenticate(user=self.super_admin)
        Tenant.objects.create(name="Existing PACS", code="EXISTING-001", registration_number="REG-DUP-99")

        payload = {
            "name": "Duplicate PACS",
            "code": "DUP-002",
            "registration_number": "REG-DUP-99",
            "district": "Mandya",
            "address_line_1": "Road 1",
            "village_town": "Village",
            "pin_code": "571401",
            "admin_full_name": "Admin User",
            "admin_mobile": "9999988888",
            "admin_email": "dup@pacs.coop"
        }
        res = self.client.post('/api/v1/tenants/onboard/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('registration_number', str(res.data))
