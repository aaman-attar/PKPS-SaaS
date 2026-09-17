import uuid
from django.db import models

class TenantStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    APPROVED = 'APPROVED', 'Approved'
    ACTIVE = 'ACTIVE', 'Active'
    SUSPENDED = 'SUSPENDED', 'Suspended'
    EXPIRED = 'EXPIRED', 'Expired'
    REJECTED = 'REJECTED', 'Rejected'

class Tenant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=100)
    registration_date = models.DateField(null=True, blank=True)
    
    address = models.TextField(blank=True, default='')
    village = models.CharField(max_length=100, blank=True, default='')
    taluk = models.CharField(max_length=100, blank=True, default='')
    district = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, default='Karnataka')
    pincode = models.CharField(max_length=10, blank=True, default='')
    
    dccb_name = models.CharField(max_length=200, help_text="District Central Cooperative Bank", blank=True, default='')
    contact_number = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField()
    
    status = models.CharField(
        max_length=20, 
        choices=TenantStatus.choices, 
        default=TenantStatus.PENDING,
        db_index=True
    )
    
    subscription_plan = models.CharField(max_length=50, default='STANDARD')
    subscription_start = models.DateField(null=True, blank=True)
    subscription_end = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenants'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.code})"
