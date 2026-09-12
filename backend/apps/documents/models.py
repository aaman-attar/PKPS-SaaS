import uuid
from django.db import models
from apps.tenants.models import Tenant
from apps.accounts.models import User

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='documents', db_index=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    document_type = models.CharField(max_length=50) # AADHAAR, PAN, LAND_RECORD, LOAN_AGREEMENT
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='documents/')
    file_size_bytes = models.BigIntegerField(default=0)
    
    upload_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'documents'
        ordering = ['-upload_date']
