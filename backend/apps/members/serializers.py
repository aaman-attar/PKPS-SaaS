from rest_framework import serializers
from .models import Member, MemberFamily, MemberLand, MemberAsset

class MemberFamilySerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberFamily
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'member')

class MemberLandSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberLand
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'member', 'registered_date')

class MemberAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberAsset
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'member', 'created_at')

class MemberSerializer(serializers.ModelSerializer):
    family_members = MemberFamilySerializer(many=True, read_only=True)
    lands = MemberLandSerializer(many=True, read_only=True)
    assets = MemberAssetSerializer(many=True, read_only=True)
    
    class Meta:
        model = Member
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'enrollment_date', 'created_at', 'updated_at')

class CreateMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = (
            'member_number', 'first_name', 'last_name', 'gender', 'dob',
            'mobile', 'email', 'address', 'village', 'taluk', 'district', 'state', 'pincode', 'status'
        )
