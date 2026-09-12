from rest_framework import serializers
from .models import ShareAccount, ShareTransaction, DividendRecord

class ShareTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShareTransaction
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'transaction_date')

class ShareAccountSerializer(serializers.ModelSerializer):
    transactions = ShareTransactionSerializer(many=True, read_only=True)
    member_number = serializers.CharField(source='member.member_number', read_only=True)
    member_name = serializers.CharField(source='member.first_name', read_only=True)

    class Meta:
        model = ShareAccount
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at')

class DividendRecordSerializer(serializers.ModelSerializer):
    member_number = serializers.CharField(source='member.member_number', read_only=True)
    member_name = serializers.CharField(source='member.first_name', read_only=True)

    class Meta:
        model = DividendRecord
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'declared_date')
