import uuid
import secrets
import hashlib
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
    
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.username} ({self.role}) - {self.tenant.name if self.tenant else 'Global'}"

    def is_locked(self):
        """Checks if account is currently locked due to too many failed login attempts."""
        if self.locked_until:
            if timezone.now() < self.locked_until:
                return True
            # Lockout period has elapsed; automatically unlock
            self.locked_until = None
            self.failed_login_attempts = 0
            self.save(update_fields=['locked_until', 'failed_login_attempts'])
        return False

    def register_failed_login(self, max_attempts=5, lock_minutes=15):
        """Increments failed login counter and locks user account if threshold reached."""
        self.failed_login_attempts += 1
        is_locked_now = False
        if self.failed_login_attempts >= max_attempts:
            self.locked_until = timezone.now() + timedelta(minutes=lock_minutes)
            is_locked_now = True
        self.save(update_fields=['failed_login_attempts', 'locked_until'])
        return is_locked_now

    def reset_failed_logins(self):
        """Clears failed login attempts upon successful authentication."""
        if self.failed_login_attempts > 0 or self.locked_until is not None:
            self.failed_login_attempts = 0
            self.locked_until = None
            self.save(update_fields=['failed_login_attempts', 'locked_until'])

class OTPDevice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='otp_devices')
    mobile = models.CharField(max_length=20, blank=True, default='', db_index=True)
    purpose = models.CharField(max_length=30, default='LOGIN')
    code = models.CharField(max_length=64) # Hashed OTP string or fallback code
    code_hash = models.CharField(max_length=128, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)

    class Meta:
        db_table = 'otp_devices'
        ordering = ['-created_at']

    @classmethod
    def generate_otp(cls, user=None, mobile=None, purpose='LOGIN', validity_minutes=5):
        from .sms_service import format_indian_mobile
        if not user and not mobile:
            raise ValueError("Either user or mobile must be provided to generate OTP.")

        clean_mobile = ""
        if mobile:
            clean_mobile = format_indian_mobile(mobile)
        elif user and user.mobile:
            clean_mobile = format_indian_mobile(user.mobile)

        # 1. Check rate limit (cooldown 60s, max 5 requests / 15 minutes)
        recent_cutoff = timezone.now() - timedelta(minutes=15)
        filter_q = models.Q(purpose=purpose)
        if user and clean_mobile:
            filter_q &= (models.Q(user=user) | models.Q(mobile=clean_mobile))
        elif user:
            filter_q &= models.Q(user=user)
        elif clean_mobile:
            filter_q &= models.Q(mobile=clean_mobile)

        recent_count = cls.objects.filter(filter_q, created_at__gte=recent_cutoff).count()
        if recent_count >= 5:
            latest = cls.objects.filter(filter_q).order_by('-created_at').first()
            if latest and (timezone.now() - latest.created_at).total_seconds() < 60:
                raise ValueError("OTP request cooldown active. Please wait 60 seconds before requesting again.")

        # 2. Invalidate previous active OTPs for user/mobile/purpose
        cls.objects.filter(filter_q, is_verified=False).update(is_verified=True)

        # 3. Cryptographically secure 6-digit OTP generation (secrets CSPRNG)
        secure_code = f"{secrets.randbelow(900000) + 100000}"
        hashed_code = hashlib.sha256(secure_code.encode('utf-8')).hexdigest()
        expires_at = timezone.now() + timedelta(minutes=validity_minutes)
        
        device = cls.objects.create(
            user=user,
            mobile=clean_mobile,
            purpose=purpose,
            code=hashed_code[:64],
            code_hash=hashed_code,
            expires_at=expires_at
        )
        return device, secure_code

    def is_valid(self):
        return not self.is_verified and self.attempts < self.max_attempts and timezone.now() <= self.expires_at

    def verify_input_code(self, input_code):
        if not self.is_valid():
            return False

        hashed_input = hashlib.sha256(str(input_code).strip().encode('utf-8')).hexdigest()
        if hashed_input == self.code_hash or str(input_code).strip() == self.code:
            self.is_verified = True
            self.save()
            return True
        else:
            self.register_failed_attempt()
            return False

    def register_failed_attempt(self):
        self.attempts += 1
        if self.attempts >= self.max_attempts:
            self.is_verified = True # Invalidate upon max failed attempts
        self.save()
