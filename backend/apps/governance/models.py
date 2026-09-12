import uuid
from django.db import models
from apps.tenants.models import Tenant

class CommitteeMeeting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='meetings', db_index=True)
    
    title = models.CharField(max_length=200)
    meeting_date = models.DateField()
    agenda = models.TextField()
    minutes = models.TextField(blank=True, default='')
    resolutions = models.TextField(blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'committee_meetings'
        ordering = ['-meeting_date']
