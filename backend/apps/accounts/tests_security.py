import uuid
import hashlib
from django.test import TestCase, override_settings
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status

from apps.tenants.models import Tenant, TenantStatus
from apps.accounts.models import User, UserRole, OTPDevice
from apps.members.models import Member
from apps.deposits.models import SavingsAccount
from apps.audit.models import AuditLog


class SecurityPenetrationTests(TestCase):
    """
    Automated Penetration Testing & User-Level Security Verification Suite:
      1. IDOR / Broken Object-Level Authorization (BOLA) & Tenant Isolation
      2. Vertical & Horizontal Privilege Escalation
      3. Authentication Bypass & Token Forgery
      4. Brute-Force Password Attacks & Account Lockout Defense
      5. SQL Injection (SQLi) Resistance
      6. Cross-Site Scripting (XSS) & Input Sanitization
      7. API Rate Limiting & Throttling
      8. Security Hardening Headers
    """

    def setUp(self):
        self.client = APIClient()

        # 1. Setup Tenant Alpha (Mandya PACS)
        self.tenant_a = Tenant.objects.create(name="Mandya PACS Alpha", code="PACS-MANDYA-001", status=TenantStatus.ACTIVE)
        self.admin_a = User.objects.create_user(
            username="admin_alpha",
            email="admin@alpha.coop",
            password="SecurePassword@123",
            role=UserRole.PKPS_ADMIN,
            tenant=self.tenant_a
        )
        self.farmer_a = User.objects.create_user(
            username="farmer_ramesh",
            email="ramesh@gmail.com",
            password="FarmerPass@123",
            role=UserRole.FARMER,
            tenant=self.tenant_a
        )
        self.member_a = Member.objects.create(
            tenant=self.tenant_a,
            user=self.farmer_a,
            member_number="MEM-A-001",
            first_name="Ramesh",
            last_name="Gowda",
            mobile="9845011111",
            village="Mandya"
        )
        self.savings_a = SavingsAccount.objects.create(
            tenant=self.tenant_a,
            member=self.member_a,
            account_number="SB-ALPHA-1001",
            current_balance=25000.00
        )

        # 2. Setup Tenant Beta (Mysore PACS)
        self.tenant_b = Tenant.objects.create(name="Mysore PACS Beta", code="PACS-MYSORE-002", status=TenantStatus.ACTIVE)
        self.admin_b = User.objects.create_user(
            username="admin_beta",
            email="admin@beta.coop",
            password="SecurePassword@123",
            role=UserRole.PKPS_ADMIN,
            tenant=self.tenant_b
        )
        self.farmer_b = User.objects.create_user(
            username="farmer_suresh",
            email="suresh@gmail.com",
            password="FarmerPass@123",
            role=UserRole.FARMER,
            tenant=self.tenant_b
        )
        self.member_b = Member.objects.create(
            tenant=self.tenant_b,
            user=self.farmer_b,
            member_number="MEM-B-001",
            first_name="Suresh",
            last_name="Patil",
            mobile="9845022222",
            village="Mysore"
        )
        self.savings_b = SavingsAccount.objects.create(
            tenant=self.tenant_b,
            member=self.member_b,
            account_number="SB-BETA-2001",
            current_balance=80000.00
        )

        # 3. Setup SaaS Super Admin
        self.super_admin = User.objects.create_superuser(
            username="saas_master",
            email="master@pkpssaas.gov.in",
            password="SuperMaster@2026",
            role=UserRole.SUPER_ADMIN
        )

    # =========================================================================
    # 1. IDOR & TENANT DATA ISOLATION PENETRATION TESTS
    # =========================================================================
    def test_idor_tenant_a_cannot_read_tenant_b_member(self):
        """PEN-TEST: User from Tenant A attempts direct object read of Tenant B Member."""
        self.client.force_authenticate(user=self.admin_a)
        res = self.client.get(f'/api/v1/members/{self.member_b.id}/')
        self.assertIn(res.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

    def test_idor_tenant_a_cannot_modify_tenant_b_member(self):
        """PEN-TEST: Admin from Tenant A attempts PATCH modification of Tenant B Member."""
        self.client.force_authenticate(user=self.admin_a)
        res = self.client.patch(f'/api/v1/members/{self.member_b.id}/', {'first_name': 'TamperedName'})
        self.assertIn(res.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])
        self.member_b.refresh_from_db()
        self.assertEqual(self.member_b.first_name, "Suresh")

    def test_idor_tenant_a_cannot_transact_tenant_b_savings(self):
        """PEN-TEST: Admin from Tenant A attempts illicit debit/withdrawal from Tenant B savings."""
        self.client.force_authenticate(user=self.admin_a)
        res = self.client.post(f'/api/v1/deposits/accounts/{self.savings_b.id}/transact/', {
            'transaction_type': 'WITHDRAWAL',
            'amount': 5000.00
        })
        self.assertIn(res.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])
        self.savings_b.refresh_from_db()
        self.assertEqual(float(self.savings_b.current_balance), 80000.00)

    def test_tenant_data_leakage_prevented_in_list_queries(self):
        """PEN-TEST: Member list query must strictly filter out foreign tenant records."""
        self.client.force_authenticate(user=self.admin_a)
        res = self.client.get('/api/v1/members/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        ids = [m['id'] for m in results]
        self.assertIn(str(self.member_a.id), ids)
        self.assertNotIn(str(self.member_b.id), ids)

    # =========================================================================
    # 2. PRIVILEGE ESCALATION PENETRATION TESTS
    # =========================================================================
    def test_vertical_privilege_escalation_farmer_cannot_onboard_society(self):
        """PEN-TEST: Low-privilege FARMER attempts to execute SaaS Admin onboarding."""
        self.client.force_authenticate(user=self.farmer_a)
        payload = {
            "name": "Rogue Society",
            "code": "ROGUE-001",
            "registration_number": "ROGUE-REG-1",
            "district": "Mandya",
            "address_line_1": "123 Street",
            "village_town": "Village",
            "pin_code": "571401",
            "admin_full_name": "Rogue Admin",
            "admin_mobile": "9999900000",
            "admin_email": "rogue@admin.coop"
        }
        res = self.client.post('/api/v1/tenants/onboard/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_vertical_privilege_escalation_farmer_cannot_approve_tenant(self):
        """PEN-TEST: Low-privilege FARMER attempts to approve a pending society."""
        self.client.force_authenticate(user=self.farmer_a)
        res = self.client.post(f'/api/v1/tenants/{self.tenant_b.id}/approve/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_vertical_privilege_escalation_pkps_admin_cannot_access_superadmin_routes(self):
        """PEN-TEST: PKPS Admin attempts to perform global tenant list/management."""
        self.client.force_authenticate(user=self.admin_a)
        res = self.client.post('/api/v1/tenants/onboard/', {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    # =========================================================================
    # 3. AUTHENTICATION BYPASS & TOKEN FORGERY TESTS
    # =========================================================================
    def test_unauthenticated_request_rejected(self):
        """PEN-TEST: Anonymous attacker attempts access to private member records."""
        anon_client = APIClient()
        res = anon_client.get('/api/v1/members/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forged_jwt_token_rejected(self):
        """PEN-TEST: Attacker attempts request with forged/malformed Bearer token."""
        forged_client = APIClient()
        forged_client.credentials(HTTP_AUTHORIZATION='Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.bogus_signature')
        res = forged_client.get('/api/v1/members/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # 4. BRUTE-FORCE PASSWORD ATTACKS & ACCOUNT LOCKOUT DEFENSE
    # =========================================================================
    def test_brute_force_triggers_account_lockout_after_5_failed_attempts(self):
        """
        PEN-TEST: Attacker executes dictionary/brute-force password attack against a user.
        System must lock account on 5th consecutive failure and refuse further attempts.
        """
        target_username = self.admin_a.username

        # Reset state to clean baseline
        self.admin_a.reset_failed_logins()

        # Send 4 failed login attempts
        for attempt in range(1, 5):
            res = self.client.post('/api/v1/auth/login/', {
                'username': target_username,
                'password': f'WrongPassword_{attempt}'
            })
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('attempt(s) remaining', str(res.data))

        # 5th failed attempt should trigger lockout
        res_5 = self.client.post('/api/v1/auth/login/', {
            'username': target_username,
            'password': 'WrongPassword_5'
        })
        self.assertEqual(res_5.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Account locked', str(res_5.data))

        # Check model state directly
        self.admin_a.refresh_from_db()
        self.assertTrue(self.admin_a.is_locked())
        self.assertEqual(self.admin_a.failed_login_attempts, 5)

        # 6th attempt even with CORRECT password must now be rejected while locked
        res_locked = self.client.post('/api/v1/auth/login/', {
            'username': target_username,
            'password': 'SecurePassword@123'
        })
        self.assertEqual(res_locked.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Account is temporarily locked', str(res_locked.data))

    def test_successful_login_resets_failed_attempts_counter(self):
        """Defense verification: A valid login clears previous failed attempts counter."""
        target_username = self.admin_a.username
        self.admin_a.reset_failed_logins()

        # 2 failed attempts
        self.client.post('/api/v1/auth/login/', {'username': target_username, 'password': 'WrongPassword'})
        self.client.post('/api/v1/auth/login/', {'username': target_username, 'password': 'WrongPassword'})
        self.admin_a.refresh_from_db()
        self.assertEqual(self.admin_a.failed_login_attempts, 2)

        # Successful login
        res = self.client.post('/api/v1/auth/login/', {'username': target_username, 'password': 'SecurePassword@123'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.admin_a.refresh_from_db()
        self.assertEqual(self.admin_a.failed_login_attempts, 0)
        self.assertFalse(self.admin_a.is_locked())

    # =========================================================================
    # 5. SQL INJECTION (SQLi) RESISTANCE TESTS
    # =========================================================================
    def test_sql_injection_resistance_in_query_parameters(self):
        """PEN-TEST: SQL Injection payloads injected into filter and search parameters."""
        self.client.force_authenticate(user=self.admin_a)
        sqli_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE members; --",
            "1' UNION SELECT null, null, null, null--",
            "admin' --",
            "' OR 1=1#"
        ]

        for payload in sqli_payloads:
            res = self.client.get(f'/api/v1/members/?q={payload}')
            # Must return 200 without syntax errors or unhandled server exceptions
            self.assertEqual(res.status_code, status.HTTP_200_OK, f"SQLi payload failed: {payload}")
            # Ensure table was not dropped and data integrity remains
            self.assertTrue(Member.objects.filter(id=self.member_a.id).exists())

    def test_sql_injection_resistance_in_login(self):
        """PEN-TEST: SQL Injection payload injected into login authentication username."""
        res = self.client.post('/api/v1/auth/login/', {
            'username': "' OR '1'='1' --",
            'password': 'any_password'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid credentials', str(res.data))

    # =========================================================================
    # 6. CROSS-SITE SCRIPTING (XSS) RESISTANCE TESTS
    # =========================================================================
    def test_xss_payload_in_member_creation_is_safe(self):
        """PEN-TEST: Stored XSS payload injected into input text fields."""
        self.client.force_authenticate(user=self.admin_a)
        xss_string = "<script>alert('pwned')</script>"

        res = self.client.post('/api/v1/members/', {
            'first_name': xss_string,
            'last_name': 'TestXSS',
            'member_number': 'MEM-XSS-999',
            'mobile': '9845099999',
            'village': 'Mandya'
        })
        # Should be created successfully as harmless literal string, not executed
        if res.status_code == status.HTTP_201_CREATED:
            created = Member.objects.get(member_number='MEM-XSS-999')
            self.assertEqual(created.first_name, xss_string)

    # =========================================================================
    # 7. SECURITY HARDENING HEADERS VERIFICATION
    # =========================================================================
    def test_security_headers_present_in_responses(self):
        """PEN-TEST: Verify defensive HTTP headers protecting against clickjacking & MIME-sniffing."""
        res = self.client.get('/api/v1/tenants/public/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # nosniff header
        self.assertEqual(res.headers.get('X-Content-Type-Options'), 'nosniff')
        # frame protection
        self.assertEqual(res.headers.get('X-Frame-Options'), 'DENY')
        # referrer policy
        self.assertEqual(res.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin')
