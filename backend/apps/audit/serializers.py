from rest_framework import serializers
from .models import AuditLog, BlockchainBlock, BlockTransaction

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = ('id', 'timestamp', 'hash', 'previous_hash')


class BlockTransactionSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.username', read_only=True)

    class Meta:
        model = BlockTransaction
        fields = (
            'id', 'tx_index', 'tx_hash', 'tx_type', 'actor_username',
            'entity_type', 'entity_id', 'amount', 'payload', 'merkle_proof', 'created_at'
        )


class BlockchainBlockSerializer(serializers.ModelSerializer):
    transactions = BlockTransactionSerializer(many=True, read_only=True)
    tenant_code = serializers.CharField(source='tenant.code', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)

    class Meta:
        model = BlockchainBlock
        fields = (
            'id', 'tenant', 'tenant_code', 'tenant_name', 'block_index',
            'previous_hash', 'merkle_root', 'block_hash', 'nonce',
            'difficulty', 'tx_count', 'is_anchored', 'anchor_network',
            'anchor_tx_hash', 'anchor_timestamp', 'sealed_at', 'transactions'
        )


class BlockchainBlockListSerializer(serializers.ModelSerializer):
    tenant_code = serializers.CharField(source='tenant.code', read_only=True)

    class Meta:
        model = BlockchainBlock
        fields = (
            'id', 'tenant', 'tenant_code', 'block_index',
            'previous_hash', 'merkle_root', 'block_hash', 'nonce',
            'difficulty', 'tx_count', 'is_anchored', 'anchor_network',
            'anchor_tx_hash', 'anchor_timestamp', 'sealed_at'
        )
