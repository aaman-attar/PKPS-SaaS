from rest_framework import serializers
from .models import LoanProduct, LoanApplication, LoanAccount, LoanRepayment
from apps.members.models import Member

class LoanProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = LoanProduct
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at')

class LoanRepaymentSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.first_name', read_only=True)
    member_number = serializers.CharField(source='member.member_number', read_only=True)

    class Meta:
        model = LoanRepayment
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'payment_date', 'receipt_number')

class LoanAccountSerializer(serializers.ModelSerializer):
    repayments = LoanRepaymentSerializer(many=True, read_only=True)
    member_name = serializers.CharField(source='member.first_name', read_only=True)
    member_number = serializers.CharField(source='member.member_number', read_only=True)

    class Meta:
        model = LoanAccount
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'disbursed_date')

class LoanApplicationSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    member_number = serializers.CharField(source='member.member_number', read_only=True)
    product_name = serializers.CharField(source='loan_product.name', read_only=True)
    loan_account = LoanAccountSerializer(read_only=True)

    class Meta:
        model = LoanApplication
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'application_number', 'applied_date', 'created_at')

    def get_member_name(self, obj):
        if obj.member:
            return f"{obj.member.first_name} {obj.member.last_name}".strip()
        return "Unknown"

class CreateLoanApplicationSerializer(serializers.ModelSerializer):
    member = serializers.PrimaryKeyRelatedField(queryset=Member.objects.all(), required=False, allow_null=True)

    class Meta:
        model = LoanApplication
        fields = ('member', 'loan_product', 'requested_amount', 'purpose')

