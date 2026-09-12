import uuid
import random
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from datetime import timedelta
from apps.tenants.models import Tenant

class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'SaaS Super Admin'
    SUPPORT_ADMIN = 'SUPPORT_ADMIN', 'SaaS Support Admin'
    
    PKPS_ADMIN = 'PKPS_ADMIN', 'PKPS Administrator'
    SECRETARY = 'SECRETARY', 'PKPS Secretary'
    MANAGER = 'MANAGER', 'PKPS Manager'
    ACCOUNTANT = 'ACCOUNTANT', 'PKPS Accountant'
    LOAN_OFFICER = 'LOAN_OFFICER', 'Loan Officer'
    CASHIER = 'CASHIER', 'Cashier'
    STAFF = 'STAFF', 'Staff'
    AUDITOR = 'AUDITOR', 'Auditor'
    COMMITTEE = 'COMMITTEE', 'Committee / Management'
    
    FARMER = 'FARMER', 'Farmer / Member'

class CustomUserManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        email = self.normalize_email(email) if email else ''
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.SUPER_ADMIN)
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=30, choices=UserRole.choices, default=UserRole.FARMER, db_index=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    mobile = models.CharField(max_length=20, blank=True, default='')
    
    is_mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=100, blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.username} ({self.role}) - {self.tenant.name if self.tenant else 'Global'}"

class OTPDevice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_devices')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)

    class Meta:
        db_table = 'otp_devices'

    @classmethod
    def generate_otp(cls, user, validity_minutes=10):
        code = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timedelta(minutes=validity_minutes)
        return cls.objects.create(user=user, code=code, expires_at=expires_at)

    def is_valid(self):
        return not self.is_verified and timezone.now() <= self.expires_at
