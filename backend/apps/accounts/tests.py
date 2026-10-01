from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from apps.tenants.models import Tenant
from apps.accounts.models import User, UserRole, OTPDevice

class AuthenticationLifecycleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tenant = Tenant.objects.create(name="Mandya PACS", code="TENANT-001")
        
        self.admin_user = User.objects.create_user(
            username="admin_test",
            password="AdminPassword@123",
            role=UserRole.PKPS_ADMIN,
            tenant=self.tenant,
            mobile="9876543210"
        )
        self.farmer_user = User.objects.create_user(
            username="farmer_test",
            password="FarmerPassword@123",
            role=UserRole.FARMER,
            tenant=self.tenant,
            mobile="9876543211"
        )

    def test_invalid_password_login(self):
        res = self.client.post('/api/v1/auth/login/', {'username': 'admin_test', 'password': 'WrongPassword'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_farmer_login_direct_jwt(self):
        res = self.client.post('/api/v1/auth/login/', {'username': 'farmer_test', 'password': 'FarmerPassword@123'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['mfa_required'])
        self.assertIn('access', res.data)

    def test_admin_mfa_trigger_and_otp_flow(self):
        res = self.client.post('/api/v1/auth/login/', {'username': 'admin_test', 'password': 'AdminPassword@123'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['mfa_required'])

        device = OTPDevice.objects.filter(user=self.admin_user, is_verified=False).latest('created_at')
        self.assertIsNotNone(device)
        self.assertTrue(len(device.code_hash) > 0)

        # Test invalid OTP code attempt
        res_fail = self.client.post('/api/v1/auth/verify-otp/', {'username': 'admin_test', 'otp_code': '000000'})
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)
        
        device.refresh_from_db()
        self.assertEqual(device.attempts, 1)

    def test_otp_max_attempts_invalidation(self):
        OTPDevice.generate_otp(self.admin_user)
        device = OTPDevice.objects.filter(user=self.admin_user, is_verified=False).latest('created_at')

        # Exhaust 3 attempts
        for _ in range(3):
            self.client.post('/api/v1/auth/verify-otp/', {'username': 'admin_test', 'otp_code': '999999'})

        device.refresh_from_db()
        self.assertTrue(device.is_verified) # Invalidated upon max attempts
        self.assertFalse(device.is_valid())
