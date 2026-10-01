from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AuditLog, BlockchainBlock, BlockTransaction
from .serializers import (
    AuditLogSerializer, BlockchainBlockSerializer,
    BlockchainBlockListSerializer, BlockTransactionSerializer
)
from .services import compute_hash
from .blockchain_service import seal_next_block, verify_entire_blockchain
from .merkle import verify_merkle_proof
from apps.tenants.permissions import EnforceTenantIsolation, IsPKPSAdmin

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return AuditLog.objects.all()
        if user.tenant:
            return AuditLog.objects.filter(tenant=user.tenant)
        return AuditLog.objects.none()

    @action(detail=False, methods=['get'], url_path='verify-chain')
    def verify_chain(self, request):
        user = request.user
        raw_logs = list(self.get_queryset())
        if not raw_logs:
            return Response({'chain_intact': True, 'total_audited_records': 0, 'compromised_log_id': None})

        by_prev = {l.previous_hash: l for l in raw_logs}
        
        current_prev = '0' * 64
        verified_count = 0
        broken_id = None
        is_valid = True

        while current_prev in by_prev:
            log = by_prev[current_prev]
            verified_count += 1

            user_id_str = str(log.user.id) if log.user else 'SYSTEM'
            expected_hash = compute_hash(
                log.timestamp.isoformat(),
                user_id_str,
                log.action,
                str(log.entity_id),
                log.new_values or {},
                log.previous_hash
            )

            if log.hash != expected_hash:
                is_valid = False
                broken_id = str(log.id)
                break

            current_prev = log.hash

        if is_valid and verified_count != len(raw_logs):
            is_valid = False
            for log in raw_logs:
                if log.hash != current_prev and log.previous_hash != current_prev:
                    broken_id = str(log.id)
                    break
            if not broken_id and raw_logs:
                broken_id = str(raw_logs[0].id)

        return Response({
            'chain_intact': is_valid,
            'total_audited_records': len(raw_logs),
            'compromised_log_id': broken_id
        })


class BlockchainViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Decentralized & Tamper-Evident Cooperative Ledger API.
    Provides:
      - Block streaming & detail inspection
      - On-demand block sealing / mining
      - Cryptographic Merkle Root verification
      - Transaction Merkle Proof verification
      - Public Blockchain Anchor tracking (Polygon PoS)
    """
    queryset = BlockchainBlock.objects.all()
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_serializer_class(self):
        if self.action == 'list':
            return BlockchainBlockListSerializer
        return BlockchainBlockSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return BlockchainBlock.objects.all().order_by('-block_index')
        if user.tenant:
            return BlockchainBlock.objects.filter(tenant=user.tenant).order_by('-block_index')
        return BlockchainBlock.objects.none()

    @action(detail=False, methods=['post'], url_path='seal-block', permission_classes=[IsPKPSAdmin])
    def seal_block(self, request):
        """Bundles pending unsealed transactions into a newly minted cryptographic block."""
        tenant = request.user.tenant if request.user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN'] else None
        target_tenant_id = request.data.get('tenant_id')
        if request.user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN'] and target_tenant_id:
            from apps.tenants.models import Tenant
            tenant = Tenant.objects.filter(id=target_tenant_id).first()

        new_block = seal_next_block(tenant=tenant)
        if not new_block:
            return Response({'message': 'No pending transactions to seal.'}, status=status.HTTP_200_OK)

        return Response({
            'message': f'Block #{new_block.block_index} successfully sealed and anchored.',
            'block': BlockchainBlockSerializer(new_block).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='verify-chain')
    def verify_chain(self, request):
        """Mathematically verifies the full blockchain from Genesis to Latest block."""
        tenant = request.user.tenant if request.user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN'] else None
        target_tenant_id = request.query_params.get('tenant_id')
        if request.user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN'] and target_tenant_id:
            from apps.tenants.models import Tenant
            tenant = Tenant.objects.filter(id=target_tenant_id).first()

        report = verify_entire_blockchain(tenant=tenant)
        return Response(report)

    @action(detail=False, methods=['post'], url_path='verify-proof')
    def verify_proof(self, request):
        """
        Cryptographically verifies an individual transaction's Merkle Proof
        against an expected block Merkle Root.
        """
        leaf_hash = request.data.get('leaf_hash', '').strip()
        merkle_proof = request.data.get('merkle_proof', [])
        expected_root = request.data.get('expected_root', '').strip()

        if not leaf_hash or not expected_root:
            return Response({'detail': 'leaf_hash and expected_root are required.'}, status=status.HTTP_400_BAD_REQUEST)

        is_valid = verify_merkle_proof(leaf_hash, merkle_proof, expected_root)
        return Response({
            'is_valid': is_valid,
            'leaf_hash': leaf_hash,
            'expected_root': expected_root,
            'status': 'VERIFIED' if is_valid else 'FAILED_TAMPER_DETECTED'
        })

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Returns high-level statistics for the blockchain ledger."""
        tenant = request.user.tenant if request.user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN'] else None
        blocks_qs = BlockchainBlock.objects.filter(tenant=tenant)
        total_blocks = blocks_qs.count()
        latest_block = blocks_qs.order_by('-block_index').first()
        pending_txs = BlockTransaction.objects.filter(tenant=tenant, block__isnull=True).count()
        total_txs = BlockTransaction.objects.filter(tenant=tenant, block__isnull=False).count()

        return Response({
            'total_blocks': total_blocks,
            'total_transactions': total_txs,
            'pending_transactions': pending_txs,
            'latest_block_index': latest_block.block_index if latest_block else None,
            'latest_block_hash': latest_block.block_hash if latest_block else None,
            'anchor_network': 'Polygon PoS',
            'latest_anchor_tx': latest_block.anchor_tx_hash if latest_block else None,
        })
