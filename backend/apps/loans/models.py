import uuid
from django.db import models
from apps.tenants.models import Tenant
from apps.members.models import Member
from apps.accounts.models import User

class LoanApplicationStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    SUBMITTED = 'SUBMITTED', 'Submitted'
    UNDER_VERIFICATION = 'UNDER_VERIFICATION', 'Under Verification'
    UNDER_ASSESSMENT = 'UNDER_ASSESSMENT', 'Under Assessment'
    PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'
    SANCTIONED = 'SANCTIONED', 'Sanctioned'
    DISBURSED = 'DISBURSED', 'Disbursed'
    CLOSED = 'CLOSED', 'Closed'

class LoanAccountStatus(models.TextChoices):
    CURRENT = 'CURRENT', 'Current'
    DUE = 'DUE', 'Due Soon'
    OVERDUE = 'OVERDUE', 'Overdue'
    PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
    RECOVERY = 'RECOVERY', 'Under Recovery'
    CLOSED = 'CLOSED', 'Closed'

class LoanProduct(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='loan_products', db_index=True)
    
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=150)
    interest_rate_pa = models.DecimalField(max_digits=5, decimal_places=2) # e.g., 7.00
    min_amount = models.DecimalField(max_digits=18, decimal_places=2, default=1000.00)
    max_amount = models.DecimalField(max_digits=18, decimal_places=2, default=500000.00)
    tenure_months = models.IntegerField(default=12)
    description = models.TextField(blank=True, default='')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'loan_products'
        unique_together = ('tenant', 'code')

    def __str__(self):
        return f"{self.name} ({self.interest_rate_pa}%)"

class LoanApplication(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='loan_applications', db_index=True)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='loan_applications')
    loan_product = models.ForeignKey(LoanProduct, on_delete=models.PROTECT, related_name='applications')
    
    application_number = models.CharField(max_length=50, db_index=True)
    requested_amount = models.DecimalField(max_digits=18, decimal_places=2)
    purpose = models.TextField()
    
    status = models.CharField(max_length=30, choices=LoanApplicationStatus.choices, default=LoanApplicationStatus.SUBMITTED, db_index=True)
    applied_date = models.DateTimeField(auto_now_add=True)
    
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_loans')
    verified_date = models.DateTimeField(null=True, blank=True)
    
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_loans')
    approved_amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    approved_date = models.DateTimeField(null=True, blank=True)
    
    rejection_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'loan_applications'
        unique_together = ('tenant', 'application_number')
        ordering = ['-applied_date']

    def __str__(self):
        return f"{self.application_number} - {self.member.first_name} (₹{self.requested_amount})"

class LoanAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='loan_accounts', db_index=True)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='loan_accounts')
    application = models.OneToOneField(LoanApplication, on_delete=models.PROTECT, related_name='loan_account')
    
    account_number = models.CharField(max_length=50, db_index=True)
    sanctioned_amount = models.DecimalField(max_digits=18, decimal_places=2)
    disbursed_amount = models.DecimalField(max_digits=18, decimal_places=2)
    disbursed_date = models.DateTimeField(auto_now_add=True)
    
    interest_rate_pa = models.DecimalField(max_digits=5, decimal_places=2)
    outstanding_principal = models.DecimalField(max_digits=18, decimal_places=2)
    outstanding_interest = models.DecimalField(max_digits=18, decimal_places=2, default=0.00)
    overdue_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.00)
    
    loan_status = models.CharField(max_length=20, choices=LoanAccountStatus.choices, default=LoanAccountStatus.CURRENT, db_index=True)
    next_due_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'loan_accounts'
        unique_together = ('tenant', 'account_number')
        ordering = ['-disbursed_date']

    def __str__(self):
        return f"Loan {self.account_number} - Bal: ₹{self.outstanding_principal}"

class LoanRepayment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='loan_repayments', db_index=True)
    loan_account = models.ForeignKey(LoanAccount, on_delete=models.CASCADE, related_name='repayments')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='repayments')
    
    receipt_number = models.CharField(max_length=50, unique=True, db_index=True)
    total_paid = models.DecimalField(max_digits=18, decimal_places=2)
    principal_component = models.DecimalField(max_digits=18, decimal_places=2)
    interest_component = models.DecimalField(max_digits=18, decimal_places=2)
    penalty_component = models.DecimalField(max_digits=18, decimal_places=2, default=0.00)
    
    payment_mode = models.CharField(max_length=30, default='CASH')
    payment_date = models.DateTimeField(auto_now_add=True)
    collected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'loan_repayments'
        ordering = ['-payment_date']
