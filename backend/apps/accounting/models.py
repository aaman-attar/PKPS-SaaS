import uuid
from django.db import models
from apps.tenants.models import Tenant
from apps.accounts.models import User

class AccountType(models.TextChoices):
    ASSET = 'ASSET', 'Asset'
    LIABILITY = 'LIABILITY', 'Liability'
    EQUITY = 'EQUITY', 'Equity / Share Capital'
    INCOME = 'INCOME', 'Income'
    EXPENSE = 'EXPENSE', 'Expense'

class AccountHead(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='account_heads', db_index=True)
    
    code = models.CharField(max_length=50, db_index=True)
    name = models.CharField(max_length=150)
    type = models.CharField(max_length=20, choices=AccountType.choices)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_accounts')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'account_heads'
        unique_together = ('tenant', 'code')
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name} ({self.type})"

class JournalEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='journal_entries', db_index=True)
    
    entry_number = models.CharField(max_length=50, db_index=True)
    date = models.DateField(auto_now_add=True)
    narration = models.TextField()
    posted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    status = models.CharField(max_length=20, default='POSTED') # POSTED, REVERSED
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'journal_entries'
        unique_together = ('tenant', 'entry_number')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.entry_number} ({self.date})"

class JournalLine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='journal_lines', db_index=True)
    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account_head = models.ForeignKey(AccountHead, on_delete=models.PROTECT, related_name='journal_lines')
    
    debit = models.DecimalField(max_digits=18, decimal_places=2, default=0.00)
    credit = models.DecimalField(max_digits=18, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'journal_lines'
