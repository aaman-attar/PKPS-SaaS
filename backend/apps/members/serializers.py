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
    masked_aadhaar = serializers.CharField(source='get_masked_aadhaar', read_only=True)
    loan_applications = serializers.SerializerMethodField()
    loan_accounts = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'enrollment_date', 'created_at', 'updated_at', 'kyc_verified_by', 'kyc_verified_at')


    def get_loan_applications(self, obj):
        from apps.loans.serializers import LoanApplicationSerializer
        return LoanApplicationSerializer(obj.loan_applications.all(), many=True).data

    def get_loan_accounts(self, obj):
        from apps.loans.serializers import LoanAccountSerializer
        return LoanAccountSerializer(obj.loan_accounts.all(), many=True).data



class CreateMemberSerializer(serializers.ModelSerializer):
    land_survey_number = serializers.CharField(required=False, allow_blank=True, write_only=True)
    land_area_acres = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0.00, write_only=True)
    land_unit = serializers.CharField(required=False, default='Acres', write_only=True)
    land_ownership_type = serializers.CharField(required=False, default='Self Owned', write_only=True)

    class Meta:
        model = Member
        fields = (
            'member_number', 'first_name', 'middle_name', 'last_name', 'local_language_name',
            'gender', 'dob', 'mobile', 'email', 'aadhaar_number', 'is_kyc_verified',
            'father_name', 'spouse_name', 'marital_status', 'blood_group', 'religion',
            'caste_category', 'qualification', 'occupation', 'annual_income',
            'board_resolution_no', 'board_resolution_date', 'dccb_sb_account_no', 'ledger_folio_no',
            'address', 'village', 'taluk', 'district', 'state', 'pincode', 'status',
            'land_survey_number', 'land_area_acres', 'land_unit', 'land_ownership_type'
        )

    def create(self, validated_data):
        land_survey_number = validated_data.pop('land_survey_number', '')
        land_area_acres = validated_data.pop('land_area_acres', 0.00)
        land_unit = validated_data.pop('land_unit', 'Acres')
        land_ownership_type = validated_data.pop('land_ownership_type', 'Self Owned')

        # Auto-link user if a registered farmer account exists with this mobile number
        mobile = validated_data.get('mobile', '')
        from apps.accounts.models import User
        if mobile and not validated_data.get('user'):
            existing_user = User.objects.filter(mobile=mobile, member_profile__isnull=True).first()
            if existing_user:
                validated_data['user'] = existing_user
                if not existing_user.tenant and validated_data.get('tenant'):
                    existing_user.tenant = validated_data['tenant']
                    existing_user.save()

        member = super().create(validated_data)

        # Create land record if survey number provided
        if land_survey_number:
            MemberLand.objects.create(
                tenant=member.tenant,
                member=member,
                survey_number=land_survey_number,
                area_acres=land_area_acres,
                unit=land_unit,
                village=member.village or 'Village',
                taluk=member.taluk,
                district=member.district,
                ownership_type=land_ownership_type
            )

        return member


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
            'id', 'tenant', 'first_name', 'middle_name', 'last_name', 'local_language_name',
            'father_name', 'spouse_name', 'marital_status', 'blood_group', 'religion',
            'caste_category', 'qualification', 'occupation', 'annual_income',
            'mobile', 'email', 'aadhaar_number', 'gender', 'dob',
            'address', 'village', 'taluk', 'district', 'state', 'pincode',
            'dccb_sb_account_no', 'ledger_folio_no', 'board_resolution_no', 'board_resolution_date',
            'land_survey_number', 'land_area_acres', 'land_unit', 'land_rtc_no',
            'land_ownership_type', 'land_crop_type', 'land_irrigation_type',
            'utara_document', 'status', 'created_at'
        )
        read_only_fields = ('id', 'status', 'created_at')


