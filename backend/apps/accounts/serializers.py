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
        read_only_fields = ('id', 'created_at')

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
        username = attrs.get('username')
        password = attrs.get('password')

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError({'detail': 'Invalid credentials.'})

        if not user.is_active:
            raise serializers.ValidationError({'detail': 'User account is disabled.'})

        attrs['user'] = user
        return attrs

class OTPVerifySerializer(serializers.Serializer):
    username = serializers.CharField()
    otp_code = serializers.CharField(max_length=6, min_length=6)
