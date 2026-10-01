import uuid
import secrets
import hashlib
from django.db import models
from django.utils import timezone
from datetime import timedelta


class TenantStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    SUBMITTED = 'SUBMITTED', 'Submitted'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    DOCUMENTS_PENDING = 'DOCUMENTS_PENDING', 'Documents Pending'
    APPROVED = 'APPROVED', 'Approved'
    ACTIVE = 'ACTIVE', 'Active'
    REJECTED = 'REJECTED', 'Rejected'
    SUSPENDED = 'SUSPENDED', 'Suspended'
    INACTIVE = 'INACTIVE', 'Inactive'
    CLOSED = 'CLOSED', 'Closed'


class SocietyType(models.TextChoices):
    PACS = 'PACS', 'Primary Agricultural Credit Society (PACS)'
    AGRICULTURAL = 'AGRICULTURAL', 'Agricultural Cooperative Society'
    CREDIT = 'CREDIT', 'Credit Cooperative Society'
    MULTIPURPOSE = 'MULTIPURPOSE', 'Multipurpose Cooperative Society'
    OTHER = 'OTHER', 'Other'


class AreaOfOperation(models.TextChoices):
    VILLAGE = 'VILLAGE', 'Village'
    MULTIPLE_VILLAGES = 'MULTIPLE_VILLAGES', 'Multiple Villages'
    GRAM_PANCHAYAT = 'GRAM_PANCHAYAT', 'Gram Panchayat'
    TALUK = 'TALUK', 'Taluk'
    DISTRICT = 'DISTRICT', 'District'
    OTHER = 'OTHER', 'Other'


class SubscriptionPlan(models.TextChoices):
    TRIAL = 'TRIAL', 'Trial'
    BASIC = 'BASIC', 'Basic'
    STANDARD = 'STANDARD', 'Standard'
    PROFESSIONAL = 'PROFESSIONAL', 'Professional'
    ENTERPRISE = 'ENTERPRISE', 'Enterprise'


class InvitationStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    ACCEPTED = 'ACCEPTED', 'Accepted'
    EXPIRED = 'EXPIRED', 'Expired'
    REVOKED = 'REVOKED', 'Revoked'


class DocumentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    VERIFIED = 'VERIFIED', 'Verified'
    REJECTED = 'REJECTED', 'Rejected'
    EXPIRED = 'EXPIRED', 'Expired'


class DocumentType(models.TextChoices):
    REGISTRATION_CERTIFICATE = 'REGISTRATION_CERTIFICATE', 'Registration Certificate'
    BYE_LAWS = 'BYE_LAWS', 'Bye-Laws'
    MEMORANDUM = 'MEMORANDUM', 'Memorandum / Formation Document'
    PAN = 'PAN', 'PAN'
    ADDRESS_PROOF = 'ADDRESS_PROOF', 'Registered Office Address Proof'
    BOARD_RESOLUTION = 'BOARD_RESOLUTION', 'Board/Committee Resolution'
    SIGNATORY_ID = 'SIGNATORY_ID', 'Authorized Signatory ID Proof'
    AUDIT_REPORT = 'AUDIT_REPORT', 'Latest Audit Report'
    OTHER = 'OTHER', 'Other'


class BankType(models.TextChoices):
    DCCB = 'DCCB', 'District Central Cooperative Bank (DCCB)'
    STCB = 'STCB', 'State Cooperative Bank (StCB)'
    NATIONALIZED = 'NATIONALIZED', 'Nationalized Bank'
    PRIVATE = 'PRIVATE', 'Private Bank'
    RRB = 'RRB', 'Regional Rural Bank (RRB)'
    OTHER = 'OTHER', 'Other'


class AccountType(models.TextChoices):
    SAVINGS = 'SAVINGS', 'Savings Account'
    CURRENT = 'CURRENT', 'Current Account'
    OVERDRAFT = 'OVERDRAFT', 'Overdraft Account'
    LOAN = 'LOAN', 'Loan Account'
    OTHER = 'OTHER', 'Other'


class Tenant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True, help_text="Unique tenant code e.g. PKPS-MANDYA-0001")
    name = models.CharField(max_length=255)
    society_type = models.CharField(
        max_length=30,
        choices=SocietyType.choices,
        default=SocietyType.PACS
    )

    # Legacy/convenience fields kept for backward compatibility and quick queries
    registration_number = models.CharField(max_length=100, blank=True, default='')
    registration_date = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True, default='')
    village = models.CharField(max_length=100, blank=True, default='')
    taluk = models.CharField(max_length=100, blank=True, default='')
    district = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, default='Karnataka')
    pincode = models.CharField(max_length=10, blank=True, default='')
    dccb_name = models.CharField(max_length=200, help_text="District Central Cooperative Bank", blank=True, default='')
    contact_number = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')

    status = models.CharField(
        max_length=20,
        choices=TenantStatus.choices,
        default=TenantStatus.DRAFT,
        db_index=True
    )

    subscription_plan = models.CharField(
        max_length=20,
        choices=SubscriptionPlan.choices,
        default=SubscriptionPlan.TRIAL
    )
    subscription_start = models.DateField(null=True, blank=True)
    subscription_end = models.DateField(null=True, blank=True)

    logo_url = models.CharField(max_length=500, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenants'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.code})"


class SocietyProfile(models.Model):
    """Extended registration/statutory information for the society."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='profile')

    registration_number = models.CharField(max_length=100)
    registration_date = models.DateField(null=True, blank=True)
    registration_authority = models.CharField(max_length=200, blank=True, default='Registrar of Cooperative Societies')
    society_category = models.CharField(max_length=100, blank=True, default='')

    pan = models.CharField(max_length=15, blank=True, default='', help_text="PAN Number")
    certificate_number = models.CharField(max_length=100, blank=True, default='')

    area_of_operation = models.CharField(
        max_length=30,
        choices=AreaOfOperation.choices,
        default=AreaOfOperation.VILLAGE
    )
    operation_villages = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'society_profiles'

    def __str__(self):
        return f"Profile: {self.tenant.name}"


class SocietyAddress(models.Model):
    """Registered office address of the society."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='registered_address')

    address_line_1 = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True, default='')
    village_town = models.CharField(max_length=100)
    gram_panchayat = models.CharField(max_length=100, blank=True, default='')
    taluk = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100, default='Karnataka')
    pin_code = models.CharField(max_length=10)

    official_mobile = models.CharField(max_length=20, blank=True, default='')
    official_email = models.EmailField(blank=True, default='')
    website = models.URLField(blank=True, default='')

    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'society_addresses'

    def __str__(self):
        return f"Address: {self.tenant.name} - {self.district}"


class SocietyBankAccount(models.Model):
    """Bank accounts associated with the society. Multiple accounts supported."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='bank_accounts')

    bank_type = models.CharField(max_length=20, choices=BankType.choices, default=BankType.DCCB)
    bank_name = models.CharField(max_length=200)
    branch_name = models.CharField(max_length=200, blank=True, default='')
    account_number = models.CharField(max_length=30)
    ifsc_code = models.CharField(max_length=20, blank=True, default='')
    account_type = models.CharField(max_length=20, choices=AccountType.choices, default=AccountType.CURRENT)
    account_holder_name = models.CharField(max_length=255, blank=True, default='')
    dccb_customer_id = models.CharField(max_length=50, blank=True, default='')

    is_primary = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'society_bank_accounts'
        ordering = ['-is_primary', '-created_at']

    def masked_account_number(self):
        """Returns masked account number showing only last 4 digits."""
        if len(self.account_number) > 4:
            return 'X' * (len(self.account_number) - 4) + self.account_number[-4:]
        return self.account_number

    def __str__(self):
        return f"{self.bank_name} - {self.masked_account_number()} ({self.tenant.name})"


class SocietyDocument(models.Model):
    """Documents uploaded during onboarding and ongoing compliance."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='society_documents')

    document_type = models.CharField(max_length=30, choices=DocumentType.choices)
    document_name = models.CharField(max_length=255)
    file = models.FileField(upload_to='society_documents/%Y/%m/', null=True, blank=True)
    file_url = models.CharField(max_length=500, blank=True, default='')

    uploaded_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='society_uploaded_documents'
    )
    upload_date = models.DateTimeField(auto_now_add=True)

    status = models.CharField(max_length=20, choices=DocumentStatus.choices, default=DocumentStatus.PENDING)
    verified_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='society_verified_documents'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, default='')
    expiry_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'society_documents'
        ordering = ['document_type', '-created_at']

    def __str__(self):
        return f"{self.document_name} ({self.get_document_type_display()}) - {self.tenant.name}"


class SocietyAuthorizedPerson(models.Model):
    """Authorized person details (Secretary, Chairman, etc.)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='authorized_persons')

    full_name = models.CharField(max_length=255)
    designation = models.CharField(max_length=100)
    mobile = models.CharField(max_length=20)
    email = models.EmailField()

    id_type = models.CharField(max_length=50, blank=True, default='', help_text="e.g. Aadhaar, PAN, Passport")
    id_number = models.CharField(max_length=50, blank=True, default='')
    authorization_document = models.FileField(upload_to='auth_documents/%Y/%m/', null=True, blank=True)

    is_primary = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'society_authorized_persons'

    def __str__(self):
        return f"{self.full_name} ({self.designation}) - {self.tenant.name}"


class TenantInvitation(models.Model):
    """Secure invitation tokens for PKPS Admin account activation."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='invitations')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='invitations')

    token_hash = models.CharField(max_length=128, unique=True)  # SHA-256 hash of raw token
    invited_email = models.EmailField()
    invited_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='sent_invitations'
    )

    status = models.CharField(
        max_length=20,
        choices=InvitationStatus.choices,
        default=InvitationStatus.PENDING
    )

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tenant_invitations'
        ordering = ['-created_at']

    @classmethod
    def generate(cls, tenant, user, invited_by, hours=24):
        """Generate a secure invitation. Returns (invitation_instance, raw_token)."""
        raw_token = secrets.token_urlsafe(48)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = timezone.now() + timedelta(hours=hours)

        invitation = cls.objects.create(
            tenant=tenant,
            user=user,
            token_hash=token_hash,
            invited_email=user.email,
            invited_by=invited_by,
            expires_at=expires_at
        )
        return invitation, raw_token

    def is_valid(self):
        return self.status == InvitationStatus.PENDING and timezone.now() <= self.expires_at

    def accept(self):
        self.status = InvitationStatus.ACCEPTED
        self.used_at = timezone.now()
        self.save()

    def __str__(self):
        return f"Invitation for {self.invited_email} ({self.tenant.code}) - {self.status}"


class Subscription(models.Model):
    """Subscription plan details for each tenant."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='subscription')

    plan = models.CharField(max_length=20, choices=SubscriptionPlan.choices, default=SubscriptionPlan.TRIAL)
    status = models.CharField(max_length=20, default='ACTIVE')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    member_limit = models.IntegerField(default=500)
    staff_limit = models.IntegerField(default=10)
    storage_limit_mb = models.IntegerField(default=1024)
    branch_limit = models.IntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subscriptions'

    def __str__(self):
        return f"{self.plan} plan - {self.tenant.name}"
