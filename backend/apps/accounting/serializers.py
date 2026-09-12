from rest_framework import serializers
from .models import AccountHead, JournalEntry, JournalLine

class AccountHeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountHead
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at')

class JournalLineSerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source='account_head.code', read_only=True)
    account_name = serializers.CharField(source='account_head.name', read_only=True)

    class Meta:
        model = JournalLine
        fields = '__all__'
        read_only_fields = ('id', 'tenant')

class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalLineSerializer(many=True, read_only=True)
    posted_by_name = serializers.CharField(source='posted_by.username', read_only=True)

    class Meta:
        model = JournalEntry
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'entry_number', 'date', 'created_at')

class CreateJournalLineSerializer(serializers.Serializer):
    account_head_id = serializers.UUIDField()
    debit = serializers.DecimalField(max_digits=18, decimal_places=2, default=0.00)
    credit = serializers.DecimalField(max_digits=18, decimal_places=2, default=0.00)

class CreateJournalEntrySerializer(serializers.Serializer):
    narration = serializers.CharField()
    lines = CreateJournalLineSerializer(many=True)
