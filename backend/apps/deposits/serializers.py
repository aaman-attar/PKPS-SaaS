from rest_framework import serializers
from .models import SavingsAccount, DepositTransaction, TermDeposit

class DepositTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepositTransaction
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'transaction_date')

class SavingsAccountSerializer(serializers.ModelSerializer):
    transactions = DepositTransactionSerializer(many=True, read_only=True)
    member_name = serializers.SerializerMethodField()
    member_number = serializers.CharField(source='member.member_number', read_only=True)
    member_mobile = serializers.CharField(source='member.mobile', read_only=True)

    class Meta:
        model = SavingsAccount
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'opened_date', 'current_balance')

    def get_member_name(self, obj):
        if obj.member:
            return f"{obj.member.first_name} {obj.member.last_name}".strip()
        return "Unknown Member"


class TermDepositSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    member_number = serializers.CharField(source='member.member_number', read_only=True)

    class Meta:
        model = TermDeposit
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'start_date', 'maturity_date', 'maturity_amount', 'deposit_number')

    def get_member_name(self, obj):
        if obj.member:
            return f"{obj.member.first_name} {obj.member.last_name}".strip()
        return "Unknown Member"
