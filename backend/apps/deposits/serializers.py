from rest_framework import serializers
from .models import SavingsAccount, DepositTransaction, TermDeposit

class DepositTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepositTransaction
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'transaction_date')

class SavingsAccountSerializer(serializers.ModelSerializer):
    transactions = DepositTransactionSerializer(many=True, read_only=True)
    member_name = serializers.CharField(source='member.first_name', read_only=True)
    member_number = serializers.CharField(source='member.member_number', read_only=True)

    class Meta:
        model = SavingsAccount
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'opened_date')

class TermDepositSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.first_name', read_only=True)
    member_number = serializers.CharField(source='member.member_number', read_only=True)

    class Meta:
        model = TermDeposit
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'start_date')
