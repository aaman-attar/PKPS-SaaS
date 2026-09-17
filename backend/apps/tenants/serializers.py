from rest_framework import serializers
from .models import Tenant

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class CreateTenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = (
            'code', 'name', 'registration_number', 'registration_date',
            'address', 'village', 'taluk', 'district', 'state', 'pincode',
            'dccb_name', 'contact_number', 'email', 'subscription_plan'
        )
        extra_kwargs = {
            'contact_number': {'required': False, 'allow_blank': True},
            'registration_date': {'required': False, 'allow_null': True},
            'address': {'required': False, 'allow_blank': True},
            'village': {'required': False, 'allow_blank': True},
            'taluk': {'required': False, 'allow_blank': True},
            'district': {'required': False, 'allow_blank': True},
            'pincode': {'required': False, 'allow_blank': True},
            'dccb_name': {'required': False, 'allow_blank': True},
            'subscription_plan': {'required': False},
        }

class TenantStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[
        'PENDING', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'REJECTED'
    ])
    notes = serializers.CharField(required=False, allow_blank=True)
