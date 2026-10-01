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


class BlockchainBlock(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name='blockchain_blocks', db_index=True)
    block_index = models.PositiveIntegerField(db_index=True)
    previous_hash = models.CharField(max_length=64)
    merkle_root = models.CharField(max_length=64)
    block_hash = models.CharField(max_length=64, db_index=True)
    nonce = models.PositiveBigIntegerField(default=0)
    difficulty = models.PositiveSmallIntegerField(default=2)
    tx_count = models.PositiveIntegerField(default=0)

    is_anchored = models.BooleanField(default=False)
    anchor_network = models.CharField(max_length=50, default='Polygon PoS')
    anchor_tx_hash = models.CharField(max_length=100, blank=True, default='')
    anchor_timestamp = models.DateTimeField(null=True, blank=True)

    sealed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'blockchain_blocks'
        unique_together = ('tenant', 'block_index')
        ordering = ['-block_index']

    def __str__(self):
        tenant_str = self.tenant.code if self.tenant else "GLOBAL"
        return f"Block #{self.block_index} [{tenant_str}] ({self.block_hash[:10]}...)"


class BlockTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    block = models.ForeignKey(BlockchainBlock, on_delete=models.CASCADE, null=True, blank=True, related_name='transactions')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name='block_transactions', db_index=True)

    tx_index = models.PositiveIntegerField(default=0)
    tx_hash = models.CharField(max_length=64, db_index=True)
    tx_type = models.CharField(max_length=50, db_index=True)

    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ledger_transactions')
    entity_type = models.CharField(max_length=50)
    entity_id = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.00)

    payload = models.JSONField(default=dict)
    merkle_proof = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'block_transactions'
        ordering = ['created_at']

    def __str__(self):
        return f"Tx {self.tx_type} ({self.tx_hash[:10]}...) - Amt: {self.amount}"

