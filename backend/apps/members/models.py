import uuid
from django.db import models
from apps.tenants.models import Tenant
from apps.accounts.models import User

class MemberStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Verification'
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'
    CLOSED = 'CLOSED', 'Membership Closed'

class Member(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='members', db_index=True)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='member_profile')
    
    member_number = models.CharField(max_length=50, db_index=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, default='')
    last_name = models.CharField(max_length=100, blank=True, default='')
    local_language_name = models.CharField(max_length=150, blank=True, default='')
    
    gender = models.CharField(max_length=20, choices=[('MALE', 'Male'), ('FEMALE', 'Female'), ('OTHER', 'Other')], default='MALE')
    dob = models.DateField(null=True, blank=True)
    mobile = models.CharField(max_length=20, db_index=True)
    email = models.EmailField(blank=True, default='')
    aadhaar_number = models.CharField(max_length=20, blank=True, default='')
    is_kyc_verified = models.BooleanField(default=False)
    
    father_name = models.CharField(max_length=100, blank=True, default='')
    spouse_name = models.CharField(max_length=100, blank=True, default='')
    marital_status = models.CharField(max_length=50, blank=True, default='Single')
    blood_group = models.CharField(max_length=10, blank=True, default='')
    religion = models.CharField(max_length=50, blank=True, default='Hinduism')
    caste_category = models.CharField(max_length=50, blank=True, default='OBC')
    qualification = models.CharField(max_length=100, blank=True, default='')
    occupation = models.CharField(max_length=100, blank=True, default='Agriculture')
    annual_income = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    board_resolution_no = models.CharField(max_length=50, blank=True, default='')
    board_resolution_date = models.DateField(null=True, blank=True)
    dccb_sb_account_no = models.CharField(max_length=50, blank=True, default='')
    ledger_folio_no = models.CharField(max_length=50, blank=True, default='')

    address = models.TextField(blank=True, default='')
    village = models.CharField(max_length=100, db_index=True)
    taluk = models.CharField(max_length=100, blank=True, default='')
    district = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, default='Karnataka')
    pincode = models.CharField(max_length=10, blank=True, default='')
    
    status = models.CharField(max_length=20, choices=MemberStatus.choices, default=MemberStatus.ACTIVE, db_index=True)
    enrollment_date = models.DateField(auto_now_add=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'members'
        unique_together = ('tenant', 'member_number')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.member_number})"

class MemberFamily(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='member_families')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='family_members')
    
    relation = models.CharField(max_length=50) # Spouse, Father, Mother, Child
    name = models.CharField(max_length=150)
    age = models.IntegerField(null=True, blank=True)
    occupation = models.CharField(max_length=100, blank=True, default='')
    is_dependent = models.BooleanField(default=True)

    class Meta:
        db_table = 'member_family'

class MemberLand(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='member_lands')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='lands')
    
    survey_number = models.CharField(max_length=100, db_index=True)
    area_acres = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, default='Acres')
    village = models.CharField(max_length=100)
    taluk = models.CharField(max_length=100, blank=True, default='')
    district = models.CharField(max_length=100, blank=True, default='')
    
    ownership_type = models.CharField(max_length=50, default='Self Owned') # Self, Joint, Leased
    land_status = models.CharField(max_length=30, default='REGISTERED') # REGISTERED, SOLD, MORTGAGED
    registered_date = models.DateField(auto_now_add=True)
    sold_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'member_lands'

class MemberAsset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='member_assets')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='assets')
    
    asset_type = models.CharField(max_length=100) # Tractor, Pump, Cattle, Equipment
    description = models.TextField(blank=True, default='')
    estimated_value = models.DecimalField(max_digits=18, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'member_assets'

class ApplicationStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Verification'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'

class MembershipApplication(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='membership_applications')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='membership_applications')
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True, default='')
    father_name = models.CharField(max_length=100, blank=True, default='')
    mobile = models.CharField(max_length=20)
    email = models.EmailField(blank=True, default='')
    aadhaar_number = models.CharField(max_length=20, blank=True, default='')
    gender = models.CharField(max_length=20, choices=[('MALE', 'Male'), ('FEMALE', 'Female'), ('OTHER', 'Other')], default='MALE')
    dob = models.DateField(null=True, blank=True)
    
    address = models.TextField(blank=True, default='')
    village = models.CharField(max_length=100)
    taluk = models.CharField(max_length=100, blank=True, default='')
    district = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, default='Karnataka')
    pincode = models.CharField(max_length=10, blank=True, default='')
    
    land_survey_number = models.CharField(max_length=100, blank=True, default='')
    land_area_acres = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    utara_document = models.FileField(upload_to='utara_docs/', null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=ApplicationStatus.choices, default=ApplicationStatus.PENDING, db_index=True)
    rejection_reason = models.TextField(blank=True, default='')
    
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_applications')
    verified_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'membership_applications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Application {self.id} - {self.first_name} {self.last_name} ({self.status})"

