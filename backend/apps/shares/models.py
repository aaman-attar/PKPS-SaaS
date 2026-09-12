import uuid
from django.db import models
from apps.tenants.models import Tenant
from apps.members.models import Member

class ShareAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='share_accounts', db_index=True)
    member = models.OneToOneField(Member, on_delete=models.CASCADE, related_name='share_account')
    
    total_shares = models.PositiveIntegerField(default=0)
    share_unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=100.00)
    total_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'share_accounts'

    def __str__(self):
        return f"Shares: {self.member.member_number} - {self.total_shares} shares (₹{self.total_amount})"

class ShareTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('DEPOSIT', 'Share Purchase / Deposit'),
        ('WITHDRAWAL', 'Share Refund / Redemption'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='share_transactions', db_index=True)
    share_account = models.ForeignKey(ShareAccount, on_delete=models.CASCADE, related_name='transactions')
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    number_of_shares = models.PositiveIntegerField()
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    reference_number = models.CharField(max_length=100, unique=True, db_index=True)
    transaction_date = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'share_transactions'
        ordering = ['-transaction_date']

class DividendRecord(models.Model):
    DIVIDEND_STATUS = [
        ('DECLARED', 'Declared'),
        ('PAID', 'Paid / Transferred'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='dividend_records', db_index=True)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='dividends')
    
    financial_year = models.CharField(max_length=20) # e.g., 2025-2026
    share_amount = models.DecimalField(max_digits=18, decimal_places=2)
    dividend_percentage = models.DecimalField(max_digits=5, decimal_places=2) # e.g. 7.50%
    dividend_amount = models.DecimalField(max_digits=18, decimal_places=2)
    
    status = models.CharField(max_length=20, choices=DIVIDEND_STATUS, default='DECLARED')
    declared_date = models.DateField(auto_now_add=True)
    paid_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'dividend_records'
        ordering = ['-declared_date']
