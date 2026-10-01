from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserRole, OTPDevice
from apps.tenants.serializers import TenantSerializer

class UserSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    tenant_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'mobile', 'first_name', 'last_name',
            'role', 'tenant', 'tenant_id', 'is_mfa_enabled', 'is_active', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'role', 'tenant', 'is_mfa_enabled', 'is_active', 'is_staff', 'is_superuser')


class CreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'mobile', 'first_name', 'last_name',
            'role', 'tenant', 'password', 'is_mfa_enabled'
        )

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class CustomTokenObtainPairSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        raw_username = attrs.get('username', '').strip()
        password = attrs.get('password')

        from django.db.models import Q
        from apps.audit.services import record_audit

        digits_only = ''.join(c for c in raw_username if c.isdigit())
        q_filter = Q(username__iexact=raw_username) | Q(email__iexact=raw_username) | Q(mobile=raw_username)
        if digits_only:
            q_filter |= Q(mobile=digits_only)
            if len(digits_only) >= 10:
                q_filter |= Q(mobile__endswith=digits_only[-10:])

        candidate = User.objects.filter(q_filter).first()

        # 1. Enforce account lockout if threshold previously breached
        if candidate and candidate.is_locked():
            record_audit(candidate, 'LOGIN_ATTEMPT_LOCKED_ACCOUNT', 'ACCOUNTS', 'User', candidate.id)
            raise serializers.ValidationError({
                'detail': 'Account is temporarily locked due to multiple failed login attempts. Please try again after 15 minutes.'
            })

        user = authenticate(username=raw_username, password=password)
        if not user and candidate:
            user = authenticate(username=candidate.username, password=password)

        # 2. Handle failed authentication & increment failure counter
        if not user:
            if candidate:
                is_locked_now = candidate.register_failed_login(max_attempts=5, lock_minutes=15)
                record_audit(
                    candidate,
                    'LOGIN_FAILED',
                    'ACCOUNTS',
                    'User',
                    candidate.id,
                    new_values={'failed_attempts': candidate.failed_login_attempts, 'locked': is_locked_now}
                )
                if is_locked_now:
                    raise serializers.ValidationError({
                        'detail': 'Account locked: 5 consecutive failed login attempts detected. Please try again after 15 minutes.'
                    })
                remaining = 5 - candidate.failed_login_attempts
                raise serializers.ValidationError({
                    'detail': f'Invalid credentials. {remaining} attempt(s) remaining before account lockout.'
                })
            raise serializers.ValidationError({'detail': 'Invalid credentials.'})

        if not user.is_active:
            raise serializers.ValidationError({'detail': 'User account is disabled.'})

        # 3. Successful authentication: reset failed logins counter
        user.reset_failed_logins()

        attrs['user'] = user
        return attrs

class OTPVerifySerializer(serializers.Serializer):
    username = serializers.CharField()
    otp_code = serializers.CharField(max_length=6, min_length=6)

class RegisterFarmerSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'mobile', 'first_name', 'last_name', 'password')

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['role'] = UserRole.FARMER
        user = User(**validated_data)
        user.set_password(password)

        # Check if a Member already exists with this mobile number in a PKPS society
        from apps.members.models import Member
        existing_member = None
        if user.mobile:
            existing_member = Member.objects.filter(mobile=user.mobile, user__isnull=True).first()

        if existing_member:
            user.tenant = existing_member.tenant
            user.save()
            existing_member.user = user
            existing_member.save()
        else:
            user.save()

        return user


