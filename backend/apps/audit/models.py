import uuid
from django.db import models
from apps.tenants.models import Tenant
from apps.accounts.models import User

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name='audit_logs', db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_actions')
    
    action = models.CharField(max_length=100, db_index=True)
    module = models.CharField(max_length=50, db_index=True)
    entity_name = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100)
    
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    previous_hash = models.CharField(max_length=64, default='0'*64)
    hash = models.CharField(max_length=64, db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} by {self.user} at {self.timestamp}"
