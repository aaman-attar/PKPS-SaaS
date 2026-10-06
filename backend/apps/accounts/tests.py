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

    def test_farmer_login_mfa_and_otp_verification(self):
        res = self.client.post('/api/v1/auth/login/', {'username': 'farmer_test', 'password': 'FarmerPassword@123'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['mfa_required'])
        self.assertIn('dev_otp', res.data)
        dev_otp = res.data['dev_otp']

        # Verify OTP for farmer
        verify_res = self.client.post('/api/v1/auth/verify-otp/', {'username': 'farmer_test', 'otp_code': dev_otp})
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', verify_res.data)
        self.assertEqual(verify_res.data['user']['role'], UserRole.FARMER)

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

    def test_farmer_request_login_otp_success(self):
        res = self.client.post('/api/v1/auth/otp/request/', {'mobile': '9876543211', 'purpose': 'LOGIN'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])
        self.assertIn('mobile', res.data)
        self.assertIn('dev_otp', res.data)

    def test_farmer_request_login_otp_unregistered_mobile(self):
        res = self.client.post('/api/v1/auth/otp/request/', {'mobile': '9999900001', 'purpose': 'LOGIN'})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_farmer_login_with_otp_success(self):
        # 1. Request OTP
        res_req = self.client.post('/api/v1/auth/otp/request/', {'mobile': '9876543211', 'purpose': 'LOGIN'})
        self.assertEqual(res_req.status_code, status.HTTP_200_OK)
        dev_otp = res_req.data['dev_otp']

        # 2. Login using OTP
        res_login = self.client.post('/api/v1/auth/otp/login/', {'mobile': '9876543211', 'otp_code': dev_otp})
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        self.assertIn('access', res_login.data)
        self.assertEqual(res_login.data['user']['username'], 'farmer_test')
        self.assertEqual(res_login.data['user']['role'], UserRole.FARMER)

    def test_farmer_login_with_invalid_otp_fails(self):
        # 1. Request OTP
        self.client.post('/api/v1/auth/otp/request/', {'mobile': '9876543211', 'purpose': 'LOGIN'})

        # 2. Attempt login with wrong OTP
        res_login = self.client.post('/api/v1/auth/otp/login/', {'mobile': '9876543211', 'otp_code': '000000'})
        self.assertEqual(res_login.status_code, status.HTTP_400_BAD_REQUEST)

    def test_farmer_registration_with_otp_lifecycle(self):
        new_mobile = "9845012345"

        # 1. Request Registration OTP
        res_req = self.client.post('/api/v1/auth/otp/request/', {'mobile': new_mobile, 'purpose': 'REGISTRATION'})
        self.assertEqual(res_req.status_code, status.HTTP_200_OK)
        reg_otp = res_req.data['dev_otp']

        # 2. Register Farmer with OTP
        reg_payload = {
            'first_name': 'Kavitha',
            'last_name': 'Gowda',
            'username': 'kavitha_farmer',
            'mobile': new_mobile,
            'password': 'SecureFarmerPass@123',
            'otp_code': reg_otp
        }
        res_reg = self.client.post('/api/v1/auth/register/', reg_payload)
        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', res_reg.data)
        self.assertEqual(res_reg.data['user']['username'], 'kavitha_farmer')
        self.assertEqual(res_reg.data['user']['role'], UserRole.FARMER)

        # 3. Duplicate registration with same mobile should fail
        res_dup = self.client.post('/api/v1/auth/otp/request/', {'mobile': new_mobile, 'purpose': 'REGISTRATION'})
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)

