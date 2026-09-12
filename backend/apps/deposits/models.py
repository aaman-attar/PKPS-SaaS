import uuid
from django.db import models
from apps.tenants.models import Tenant
from apps.members.models import Member

class SavingsAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='savings_accounts', db_index=True)
    member = models.OneToOneField(Member, on_delete=models.CASCADE, related_name='savings_account')
    
    account_number = models.CharField(max_length=50, db_index=True)
    current_balance = models.DecimalField(max_digits=18, decimal_places=2, default=0.00)
    interest_rate_pa = models.DecimalField(max_digits=5, decimal_places=2, default=4.00)
    
    status = models.CharField(max_length=20, default='ACTIVE')
    opened_date = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'savings_accounts'
        unique_together = ('tenant', 'account_number')

    def __str__(self):
        return f"Savings {self.account_number} (₹{self.current_balance})"

class DepositTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('DEPOSIT', 'Cash / Bank Deposit'),
        ('WITHDRAWAL', 'Cash / Bank Withdrawal'),
        ('INTEREST_CREDIT', 'Interest Credit'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='deposit_transactions', db_index=True)
    savings_account = models.ForeignKey(SavingsAccount, on_delete=models.CASCADE, related_name='transactions')
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    balance_after = models.DecimalField(max_digits=18, decimal_places=2)
    reference_number = models.CharField(max_length=100, unique=True, db_index=True)
    transaction_date = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'deposit_transactions'
        ordering = ['-transaction_date']

class TermDeposit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='term_deposits', db_index=True)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='term_deposits')
    
    deposit_number = models.CharField(max_length=50, db_index=True)
    principal_amount = models.DecimalField(max_digits=18, decimal_places=2)
    interest_rate_pa = models.DecimalField(max_digits=5, decimal_places=2)
    tenure_months = models.IntegerField(default=12)
    
    start_date = models.DateField(auto_now_add=True)
    maturity_date = models.DateField()
    maturity_amount = models.DecimalField(max_digits=18, decimal_places=2)
    
    status = models.CharField(max_length=30, default='ACTIVE') # ACTIVE, MATURED, CLOSED_PREMATURE

    class Meta:
        db_table = 'term_deposits'
        unique_together = ('tenant', 'deposit_number')
        ordering = ['-start_date']
