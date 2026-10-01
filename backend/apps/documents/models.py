import uuid
from django.db import models
from apps.tenants.models import Tenant
from apps.accounts.models import User

class DocumentVerificationStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Verification'
    VERIFIED = 'VERIFIED', 'Verified'
    REJECTED = 'REJECTED', 'Rejected'
    EXPIRED = 'EXPIRED', 'Expired'

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='documents', db_index=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    document_type = models.CharField(max_length=50) # AADHAAR, PAN, LAND_RECORD, RTC_UTARA, LOAN_AGREEMENT
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='documents/')
    file_size_bytes = models.BigIntegerField(default=0)
    document_hash = models.CharField(max_length=128, blank=True, default='')
    
    verification_status = models.CharField(
        max_length=20, 
        choices=DocumentVerificationStatus.choices, 
        default=DocumentVerificationStatus.PENDING, 
        db_index=True
    )
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_documents')
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, default='')
    expiry_date = models.DateField(null=True, blank=True)
    
    upload_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'documents'
        ordering = ['-upload_date']

    def __str__(self):
        return f"{self.title} ({self.document_type}) - {self.verification_status}"
