from rest_framework import serializers
from .models import (
    Tenant, SocietyProfile, SocietyAddress, SocietyBankAccount,
    SocietyDocument, SocietyAuthorizedPerson, TenantInvitation, Subscription,
    TenantStatus, SubscriptionPlan
)


# ─── Core Tenant Serializers ────────────────────────────────────────────────

class SocietyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocietyProfile
        exclude = ('tenant',)
        read_only_fields = ('id', 'created_at', 'updated_at')


class SocietyAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocietyAddress
        exclude = ('tenant',)
        read_only_fields = ('id', 'created_at', 'updated_at')


class SocietyBankAccountSerializer(serializers.ModelSerializer):
    masked_account = serializers.SerializerMethodField()

    class Meta:
        model = SocietyBankAccount
        exclude = ('tenant',)
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {
            'account_number': {'write_only': True}  # Never expose raw number in list/detail
        }

    def get_masked_account(self, obj):
        return obj.masked_account_number()


class SocietyDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    verified_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SocietyDocument
        exclude = ('tenant',)
        read_only_fields = ('id', 'upload_date', 'created_at', 'updated_at')

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return f"{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}".strip() or obj.uploaded_by.username
        return None

    def get_verified_by_name(self, obj):
        if obj.verified_by:
            return f"{obj.verified_by.first_name} {obj.verified_by.last_name}".strip() or obj.verified_by.username
        return None


class SocietyAuthorizedPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocietyAuthorizedPerson
        exclude = ('tenant',)
        read_only_fields = ('id', 'created_at', 'updated_at')


class TenantInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantInvitation
        fields = ('id', 'invited_email', 'status', 'created_at', 'expires_at', 'used_at')
        read_only_fields = fields


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        exclude = ('tenant',)
        read_only_fields = ('id', 'created_at', 'updated_at')


# ─── Full Tenant Detail Serializer ──────────────────────────────────────────

class TenantSerializer(serializers.ModelSerializer):
    profile = SocietyProfileSerializer(read_only=True)
    registered_address = SocietyAddressSerializer(read_only=True)
    bank_accounts = SocietyBankAccountSerializer(many=True, read_only=True)
    society_documents = SocietyDocumentSerializer(many=True, read_only=True)
    authorized_persons = SocietyAuthorizedPersonSerializer(many=True, read_only=True)
    subscription = SubscriptionSerializer(read_only=True)
    latest_invitation = serializers.SerializerMethodField()

    # Admin user details
    admin_user = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_latest_invitation(self, obj):
        inv = obj.invitations.order_by('-created_at').first()
        if inv:
            return TenantInvitationSerializer(inv).data
        return None

    def get_admin_user(self, obj):
        admin = obj.users.filter(role='PKPS_ADMIN').first()
        if admin:
            return {
                'id': str(admin.id),
                'name': f"{admin.first_name} {admin.last_name}".strip() or admin.username,
                'email': admin.email,
                'username': admin.username,
                'is_active': admin.is_active,
                'role': admin.role,
            }
        return None


class TenantListSerializer(serializers.ModelSerializer):
    """Compact serializer for the tenants list view."""
    admin_name = serializers.SerializerMethodField()
    admin_email = serializers.SerializerMethodField()
    document_count = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = (
            'id', 'code', 'name', 'society_type', 'district', 'status',
            'subscription_plan', 'admin_name', 'admin_email',
            'document_count', 'created_at'
        )

    def get_admin_name(self, obj):
        admin = obj.users.filter(role='PKPS_ADMIN').first()
        if admin:
            return f"{admin.first_name} {admin.last_name}".strip() or admin.username
        return None

    def get_admin_email(self, obj):
        admin = obj.users.filter(role='PKPS_ADMIN').first()
        return admin.email if admin else None

    def get_document_count(self, obj):
        return obj.society_documents.count()


# ─── Legacy / Simple Serializers ────────────────────────────────────────────

class CreateTenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = (
            'code', 'name', 'registration_number', 'registration_date',
            'address', 'village', 'taluk', 'district', 'state', 'pincode',
            'dccb_name', 'contact_number', 'email', 'subscription_plan'
        )
        extra_kwargs = {
            'contact_number': {'required': False, 'allow_blank': True},
            'registration_date': {'required': False, 'allow_null': True},
            'address': {'required': False, 'allow_blank': True},
            'village': {'required': False, 'allow_blank': True},
            'taluk': {'required': False, 'allow_blank': True},
            'district': {'required': False, 'allow_blank': True},
            'pincode': {'required': False, 'allow_blank': True},
            'dccb_name': {'required': False, 'allow_blank': True},
            'subscription_plan': {'required': False},
        }


class TenantStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=TenantStatus.choices)
    notes = serializers.CharField(required=False, allow_blank=True)


class PublicTenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ('id', 'code', 'name', 'district', 'state', 'logo_url')


# ─── Multi-Step Onboarding Wizard Serializer ─────────────────────────────────

class OnboardingBankAccountSerializer(serializers.Serializer):
    bank_type = serializers.CharField()
    bank_name = serializers.CharField()
    branch_name = serializers.CharField(required=False, allow_blank=True, default='')
    account_number = serializers.CharField()
    ifsc_code = serializers.CharField(required=False, allow_blank=True, default='')
    account_type = serializers.CharField(required=False, default='CURRENT')
    account_holder_name = serializers.CharField(required=False, allow_blank=True, default='')
    dccb_customer_id = serializers.CharField(required=False, allow_blank=True, default='')
    is_primary = serializers.BooleanField(required=False, default=True)


class OnboardingDocumentSerializer(serializers.Serializer):
    document_type = serializers.CharField()
    document_name = serializers.CharField()
    file_url = serializers.CharField(required=False, allow_blank=True, default='')
    expiry_date = serializers.DateField(required=False, allow_null=True, default=None)


class OnboardingAdminSerializer(serializers.Serializer):
    full_name = serializers.CharField()
    designation = serializers.CharField()
    mobile = serializers.CharField()
    email = serializers.EmailField()
    id_type = serializers.CharField(required=False, allow_blank=True, default='')
    id_number = serializers.CharField(required=False, allow_blank=True, default='')


class PKPSOnboardingSerializer(serializers.Serializer):
    """
    Full onboarding wizard payload.
    Validates all 7 steps and creates Tenant + all related objects atomically.
    """
    # Step 1 — Basic Info
    code = serializers.CharField(max_length=50)
    name = serializers.CharField(max_length=255)
    society_type = serializers.CharField(default='PACS')
    subscription_plan = serializers.ChoiceField(choices=SubscriptionPlan.choices, default='TRIAL')

    # Step 2 — Registration Details
    registration_number = serializers.CharField()
    registration_date = serializers.DateField(required=False, allow_null=True)
    registration_authority = serializers.CharField(required=False, allow_blank=True, default='Registrar of Cooperative Societies')
    state = serializers.CharField(default='Karnataka')
    district = serializers.CharField()
    taluk = serializers.CharField(required=False, allow_blank=True, default='')
    society_category = serializers.CharField(required=False, allow_blank=True, default='')
    area_of_operation = serializers.CharField(required=False, default='VILLAGE')
    operation_villages = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    pan = serializers.CharField(required=False, allow_blank=True, default='')
    certificate_number = serializers.CharField(required=False, allow_blank=True, default='')

    # Step 3 — Address
    address_line_1 = serializers.CharField()
    address_line_2 = serializers.CharField(required=False, allow_blank=True, default='')
    village_town = serializers.CharField()
    gram_panchayat = serializers.CharField(required=False, allow_blank=True, default='')
    address_taluk = serializers.CharField(required=False, allow_blank=True, default='')
    address_district = serializers.CharField(required=False, allow_blank=True, default='')
    address_state = serializers.CharField(required=False, default='Karnataka')
    pin_code = serializers.CharField()
    official_mobile = serializers.CharField(required=False, allow_blank=True, default='')
    official_email = serializers.EmailField(required=False, allow_blank=True, default='')
    website = serializers.CharField(required=False, allow_blank=True, default='')
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)

    # Step 4 — Banking (multiple accounts)
    bank_accounts = OnboardingBankAccountSerializer(many=True, required=False, default=list)

    # Step 5 — Documents (metadata; actual file upload is separate)
    documents = OnboardingDocumentSerializer(many=True, required=False, default=list)

    # Step 6 — Authorized Person
    auth_full_name = serializers.CharField(required=False, allow_blank=True, default='')
    auth_designation = serializers.CharField(required=False, allow_blank=True, default='')
    auth_mobile = serializers.CharField(required=False, allow_blank=True, default='')
    auth_email = serializers.EmailField(required=False, allow_blank=True, default='')
    auth_id_type = serializers.CharField(required=False, allow_blank=True, default='')
    auth_id_number = serializers.CharField(required=False, allow_blank=True, default='')

    # Step 7 — PKPS Admin Account
    admin_full_name = serializers.CharField()
    admin_designation = serializers.CharField(required=False, allow_blank=True, default='PKPS Administrator')
    admin_mobile = serializers.CharField()
    admin_email = serializers.EmailField()

    def validate_code(self, value):
        value = value.upper().strip()
        if ' ' in value:
            raise serializers.ValidationError("Tenant code must not contain spaces.")
        if Tenant.objects.filter(code=value).exists():
            raise serializers.ValidationError(f"Tenant code '{value}' is already in use.")
        return value

    def validate_registration_number(self, value):
        if Tenant.objects.filter(registration_number=value).exists():
            existing = Tenant.objects.filter(registration_number=value).first()
            raise serializers.ValidationError(
                f"A society with registration number '{value}' already exists: {existing.name} ({existing.code})"
            )
        return value

    def validate_pan(self, value):
        if value and SocietyProfile.objects.filter(pan=value).exists():
            raise serializers.ValidationError(f"A society with PAN '{value}' already exists.")
        return value

    def validate_name(self, value):
        if Tenant.objects.filter(name__iexact=value.strip()).exists():
            existing = Tenant.objects.filter(name__iexact=value.strip()).first()
            raise serializers.ValidationError(
                f"⚠ A society with a similar name already exists: {existing.name} ({existing.code}). "
                "Please verify this is not a duplicate."
            )
        return value.strip()
