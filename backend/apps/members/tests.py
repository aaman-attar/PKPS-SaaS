from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.tenants.models import Tenant
from apps.accounts.models import User, UserRole
from apps.members.models import Member, MemberStatus, KYCStatus, MembershipApplication, ApplicationStatus, MemberLand
from apps.loans.models import LoanProduct, LoanApplication, LoanAccount, LoanApplicationStatus, LoanAccountStatus

class MemberLifecycleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tenant = Tenant.objects.create(name="Mandya PACS", code="TENANT-MND")
        self.admin = User.objects.create_user(
            username="admin_mem", password="Password@123", role=UserRole.PKPS_ADMIN, tenant=self.tenant
        )
        self.farmer_user = User.objects.create_user(
            username="farmer_mem", password="Password@123", role=UserRole.FARMER, tenant=self.tenant
        )
        self.member = Member.objects.create(
            tenant=self.tenant, user=self.farmer_user, member_number="M-000500",
            first_name="Mahesh", last_name="Gowda", mobile="9876543200", village="Mandya Rural",
            aadhaar_number="123456789012"
        )

    def test_kyc_verification_and_aadhaar_masking(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/v1/members/{self.member.id}/verify-kyc/', {
            'status': 'VERIFIED'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        self.member.refresh_from_db()
        self.assertTrue(self.member.is_kyc_verified)
        self.assertEqual(self.member.kyc_status, KYCStatus.VERIFIED)
        self.assertEqual(self.member.get_masked_aadhaar(), "XXXX-XXXX-9012")

    def test_closure_eligibility_with_active_loan_blocker(self):
        self.client.force_authenticate(user=self.admin)

        # Create active loan for member
        prod = LoanProduct.objects.create(tenant=self.tenant, code="CROP-01", name="Crop Loan", interest_rate_pa=7.00)
        app = LoanApplication.objects.create(
            tenant=self.tenant, member=self.member, loan_product=prod,
            application_number="LA-TEST-01", requested_amount=50000.00, purpose="Fertilizers",
            status=LoanApplicationStatus.DISBURSED
        )
        loan_acc = LoanAccount.objects.create(
            tenant=self.tenant, member=self.member, application=app, account_number="LN-TEST-01",
            sanctioned_amount=50000.00, disbursed_amount=50000.00, interest_rate_pa=7.00,
            outstanding_principal=50000.00, loan_status=LoanAccountStatus.CURRENT
        )

        res = self.client.get(f'/api/v1/members/{self.member.id}/closure-eligibility/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['can_close'])
        self.assertTrue(len(res.data['blockers']) > 0)


class MembershipApplicationAndLinkingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tenant = Tenant.objects.create(name="Mysore District PACS", code="TENANT-MYS")
        self.admin = User.objects.create_user(
            username="mysore_admin", password="Password@123", role=UserRole.PKPS_ADMIN, tenant=self.tenant
        )
        self.new_farmer = User.objects.create_user(
            username="farmer_shiva", password="Password@123", role=UserRole.FARMER, mobile="9845011999"
        )

    def test_farmer_application_approval_creates_synchronized_member_and_land(self):
        # 1. Farmer submits application with full personal, socio-economic, and land fields
        self.client.force_authenticate(user=self.new_farmer)
        payload = {
            "tenant": str(self.tenant.id),
            "first_name": "Shiva",
            "middle_name": "Kumar",
            "last_name": "Gowda",
            "local_language_name": "ಶಿವ ಕುಮಾರ್ ಗೌಡ",
            "father_name": "Ninge Gowda",
            "spouse_name": "Lakshmi",
            "marital_status": "Married",
            "blood_group": "O+",
            "religion": "Hindu",
            "caste_category": "OBC",
            "qualification": "Graduate",
            "occupation": "Agriculture",
            "annual_income": "250000.00",
            "mobile": "9845011999",
            "email": "shiva.farmer@mysore.coop",
            "aadhaar_number": "987654321098",
            "gender": "MALE",
            "dob": "1988-05-15",
            "address": "Main Street, House No 12",
            "village": "Bannur",
            "taluk": "T Narasipura",
            "district": "Mysore",
            "state": "Karnataka",
            "pincode": "571101",
            "dccb_sb_account_no": "100200300400",
            "land_survey_number": "184/3B",
            "land_area_acres": "4.50",
            "land_unit": "Acres",
            "land_rtc_no": "RTC-889900",
            "land_ownership_type": "Self Owned",
            "land_crop_type": "Sugarcane",
            "land_irrigation_type": "KRS Canal"
        }

        res = self.client.post('/api/v1/members/applications/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        app_id = res.data['id']

        # 2. PKPS Admin inspects and approves application with custom board resolution and member number
        self.client.force_authenticate(user=self.admin)
        approve_res = self.client.post(f'/api/v1/members/applications/{app_id}/approve/', {
            'member_number': 'M-007890',
            'board_resolution_no': 'RES-2026-099',
            'board_resolution_date': '2026-09-26',
            'dccb_sb_account_no': '100200300400',
            'ledger_folio_no': 'LF-88'
        }, format='json')

        self.assertEqual(approve_res.status_code, status.HTTP_200_OK, approve_res.data)

        # 3. Verify created Member has ALL synchronized fields
        member = Member.objects.get(member_number='M-007890')
        self.assertEqual(member.user, self.new_farmer)
        self.assertEqual(member.tenant, self.tenant)
        self.assertEqual(member.first_name, "Shiva")
        self.assertEqual(member.middle_name, "Kumar")
        self.assertEqual(member.last_name, "Gowda")
        self.assertEqual(member.local_language_name, "ಶಿವ ಕುಮಾರ್ ಗೌಡ")
        self.assertEqual(member.father_name, "Ninge Gowda")
        self.assertEqual(member.spouse_name, "Lakshmi")
        self.assertEqual(member.marital_status, "Married")
        self.assertEqual(member.caste_category, "OBC")
        self.assertEqual(member.qualification, "Graduate")
        self.assertEqual(member.board_resolution_no, "RES-2026-099")
        self.assertEqual(member.dccb_sb_account_no, "100200300400")
        self.assertEqual(member.ledger_folio_no, "LF-88")
        self.assertTrue(member.is_kyc_verified)
        self.assertEqual(member.status, MemberStatus.ACTIVE)

        # 4. Verify MemberLand was created
        land = MemberLand.objects.get(member=member, survey_number="184/3B")
        self.assertEqual(float(land.area_acres), 4.50)
        self.assertEqual(land.unit, "Acres")
        self.assertEqual(land.ownership_type, "Self Owned")
        self.assertEqual(land.crop_type, "Sugarcane")

        # 5. Farmer's tenant is now the approved society
        self.new_farmer.refresh_from_db()
        self.assertEqual(self.new_farmer.tenant, self.tenant)

    def test_pkps_counter_enrollment_auto_links_farmer_user(self):
        # Admin directly enrolls a member in the PKPS portal whose mobile matches a pre-registered farmer
        self.client.force_authenticate(user=self.admin)
        enroll_payload = {
            "member_number": "M-998877",
            "first_name": "Shiva",
            "last_name": "Gowda",
            "mobile": "9845011999",  # Matches self.new_farmer.mobile
            "father_name": "Ninge Gowda",
            "village": "Bannur",
            "district": "Mysore",
            "state": "Karnataka",
            "pincode": "571101",
            "board_resolution_no": "RES-001",
            "land_survey_number": "99/1",
            "land_area_acres": "2.00"
        }
        res = self.client.post('/api/v1/members/', enroll_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)

        # Member is automatically linked to self.new_farmer
        member = Member.objects.get(member_number="M-998877")
        self.assertEqual(member.user, self.new_farmer)
        self.assertEqual(member.lands.count(), 1)
        self.assertEqual(member.lands.first().survey_number, "99/1")

    def test_farmer_registration_auto_links_to_pre_enrolled_member(self):
        # 1. Staff enrolls member with mobile 9800000001 (farmer does not have user account yet)
        self.client.force_authenticate(user=self.admin)
        Member.objects.create(
            tenant=self.tenant, member_number="M-PRE-01",
            first_name="Prakash", last_name="Hegde", mobile="9800000001", village="Bannur"
        )

        # 2. Later, Prakash signs up online with the same mobile number
        anon_client = APIClient()
        reg_res = anon_client.post('/api/v1/auth/register/', {
            "username": "prakash_hegde",
            "mobile": "9800000001",
            "first_name": "Prakash",
            "last_name": "Hegde",
            "password": "FarmerPassword@123"
        })
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)

        # 3. User account is immediately linked to pre-existing Member record and assigned to the tenant!
        prakash_user = User.objects.get(username="prakash_hegde")
        self.assertEqual(prakash_user.tenant, self.tenant)
        member = Member.objects.get(member_number="M-PRE-01")
        self.assertEqual(member.user, prakash_user)
