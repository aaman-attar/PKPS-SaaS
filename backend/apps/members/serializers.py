from rest_framework import serializers
from .models import Member, MemberFamily, MemberLand, MemberAsset

class MemberFamilySerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberFamily
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'member')

class MemberLandSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberLand
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'member', 'registered_date')

class MemberAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberAsset
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'member', 'created_at')

class MemberSerializer(serializers.ModelSerializer):
    family_members = MemberFamilySerializer(many=True, read_only=True)
    lands = MemberLandSerializer(many=True, read_only=True)
    assets = MemberAssetSerializer(many=True, read_only=True)
    loan_applications = serializers.SerializerMethodField()
    loan_accounts = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'enrollment_date', 'created_at', 'updated_at')

    def get_loan_applications(self, obj):
        from apps.loans.serializers import LoanApplicationSerializer
        return LoanApplicationSerializer(obj.loan_applications.all(), many=True).data

    def get_loan_accounts(self, obj):
        from apps.loans.serializers import LoanAccountSerializer
        return LoanAccountSerializer(obj.loan_accounts.all(), many=True).data



class CreateMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = (
            'member_number', 'first_name', 'middle_name', 'last_name', 'local_language_name',
            'gender', 'dob', 'mobile', 'email', 'aadhaar_number', 'is_kyc_verified',
            'father_name', 'spouse_name', 'marital_status', 'blood_group', 'religion',
            'caste_category', 'qualification', 'occupation', 'annual_income',
            'board_resolution_no', 'board_resolution_date', 'dccb_sb_account_no', 'ledger_folio_no',
            'address', 'village', 'taluk', 'district', 'state', 'pincode', 'status'
        )

from .models import MembershipApplication
from apps.tenants.serializers import TenantSerializer
from apps.accounts.serializers import UserSerializer

class MembershipApplicationSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    applicant = UserSerializer(read_only=True)

    class Meta:
        model = MembershipApplication
        fields = '__all__'

class CreateMembershipApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipApplication
        fields = (
            'tenant', 'first_name', 'last_name', 'father_name', 'mobile',
            'email', 'aadhaar_number', 'gender', 'dob', 'address', 'village',
            'taluk', 'district', 'state', 'pincode', 'land_survey_number',
            'land_area_acres', 'utara_document'
        )

