import uuid
from django.db import models
from apps.tenants.models import Tenant
from apps.accounts.models import User

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications', db_index=True)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
