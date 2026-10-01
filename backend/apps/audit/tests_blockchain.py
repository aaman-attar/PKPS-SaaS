from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.tenants.models import Tenant
from apps.accounts.models import User, UserRole
from apps.audit.models import BlockchainBlock, BlockTransaction
from apps.audit.blockchain_service import (
    record_ledger_transaction, seal_next_block, verify_entire_blockchain
)
from apps.audit.merkle import (
    compute_merkle_root, generate_merkle_proof, verify_merkle_proof
)


class BlockchainLedgerIntegrityTests(TestCase):
    """
    Tests for Blockchain / Ledger Integrity:
      1. Genesis Block initialization & PoW difficulty
      2. Consecutive block chaining & previous hash verification
      3. SHA-256 Merkle Tree root calculation and proof generation
      4. Mathematical tamper detection upon unauthorized DB edits
      5. Tenant isolation across blockchain ledgers
      6. REST API verification endpoints (/api/v1/audit/blockchain/)
    """

    def setUp(self):
        self.client = APIClient()

        # Tenant Alpha
        self.tenant_a = Tenant.objects.create(name="Mandya Cooperative", code="PACS-MANDYA-001")
        self.admin_a = User.objects.create_user(
            username="admin_a", password="Password@123", role=UserRole.PKPS_ADMIN, tenant=self.tenant_a
        )

        # Tenant Beta
        self.tenant_b = Tenant.objects.create(name="Mysore Cooperative", code="PACS-MYSORE-002")
        self.admin_b = User.objects.create_user(
            username="admin_b", password="Password@123", role=UserRole.PKPS_ADMIN, tenant=self.tenant_b
        )

    def test_genesis_block_creation(self):
        """Verifies automatic minting of Genesis Block #0 with standard zero previous hash."""
        genesis = seal_next_block(tenant=self.tenant_a, difficulty=2)
        self.assertIsNotNone(genesis)
        self.assertEqual(genesis.block_index, 0)
        self.assertEqual(genesis.previous_hash, '0' * 64)
        self.assertTrue(genesis.block_hash.startswith('00'))
        self.assertTrue(genesis.is_anchored)
        self.assertTrue(genesis.anchor_tx_hash.startswith('0x'))
        self.assertEqual(genesis.transactions.count(), 1)

    def test_block_chaining_and_merkle_proofs(self):
        """Verifies consecutive block sealing, Merkle root validity, and Merkle proofs."""
        # 1. Seal Genesis Block #0
        b0 = seal_next_block(tenant=self.tenant_a, difficulty=2)

        # 2. Record 3 transactions for Tenant A
        tx1 = record_ledger_transaction(
            tenant=self.tenant_a, tx_type='LOAN_DISBURSEMENT', entity_type='LoanAccount',
            entity_id='LOAN-1001', amount=50000.00, payload={'borrower': 'Ramesh'}
        )
        tx2 = record_ledger_transaction(
            tenant=self.tenant_a, tx_type='SAVINGS_DEPOSIT', entity_type='SavingsAccount',
            entity_id='SB-2002', amount=10000.00, payload={'account': 'SB-2002'}
        )
        tx3 = record_ledger_transaction(
            tenant=self.tenant_a, tx_type='SHARE_ALLOTMENT', entity_type='ShareAccount',
            entity_id='SH-3003', amount=2500.00, payload={'shares': 25}
        )

        # 3. Seal Block #1
        b1 = seal_next_block(tenant=self.tenant_a, difficulty=2)
        self.assertIsNotNone(b1)
        self.assertEqual(b1.block_index, 1)
        self.assertEqual(b1.previous_hash, b0.block_hash)
        self.assertEqual(b1.tx_count, 3)

        # 4. Verify individual Merkle Proofs for all 3 transactions
        for tx in [tx1, tx2, tx3]:
            tx.refresh_from_db()
            self.assertEqual(tx.block, b1)
            self.assertIsNotNone(tx.merkle_proof)
            valid = verify_merkle_proof(tx.tx_hash, tx.merkle_proof, b1.merkle_root)
            self.assertTrue(valid, f"Transaction {tx.id} Merkle proof failed verification against block Merkle root.")

        # 5. Verify entire blockchain health
        report = verify_entire_blockchain(tenant=self.tenant_a)
        self.assertTrue(report['chain_intact'])
        self.assertEqual(report['total_blocks'], 2)
        self.assertEqual(report['total_transactions'], 4)

    def test_tamper_detection_in_transaction_modifications(self):
        """PEN-TEST / INTEGRITY: Direct malicious database modification to transaction amounts is detected."""
        seal_next_block(tenant=self.tenant_a, difficulty=2)
        tx = record_ledger_transaction(
            tenant=self.tenant_a, tx_type='LOAN_DISBURSED', entity_type='Loan',
            entity_id='101', amount=1000.00
        )
        b1 = seal_next_block(tenant=self.tenant_a, difficulty=2)

        # Baseline verification passes
        self.assertTrue(verify_entire_blockchain(tenant=self.tenant_a)['chain_intact'])

        # Attack: Attacker modifies transaction hash in database
        BlockTransaction.objects.filter(id=tx.id).update(tx_hash='tampered_hash_' + '0' * 50)

        # Verification must now fail!
        tampered_report = verify_entire_blockchain(tenant=self.tenant_a)
        self.assertFalse(tampered_report['chain_intact'])
        self.assertEqual(tampered_report['compromised_block'], 1)

    def test_tamper_detection_in_block_linkage(self):
        """PEN-TEST / INTEGRITY: Breaking previous hash linkage is immediately caught."""
        b0 = seal_next_block(tenant=self.tenant_a, difficulty=2)
        record_ledger_transaction(tenant=self.tenant_a, tx_type='T1', entity_type='E', entity_id='1')
        b1 = seal_next_block(tenant=self.tenant_a, difficulty=2)

        # Attack: Maliciously change previous hash on block 1
        BlockchainBlock.objects.filter(id=b1.id).update(previous_hash='f' * 64)

        report = verify_entire_blockchain(tenant=self.tenant_a)
        self.assertFalse(report['chain_intact'])
        self.assertEqual(report['compromised_block'], 1)

    def test_tenant_isolation_in_blockchain_ledgers(self):
        """Cross-tenant penetration test: Tenant A cannot see or verify Tenant B's ledger."""
        seal_next_block(tenant=self.tenant_a, difficulty=2)
        seal_next_block(tenant=self.tenant_b, difficulty=2)

        self.client.force_authenticate(user=self.admin_a)
        res = self.client.get('/api/v1/audit/blockchain/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        for block in results:
            self.assertEqual(block['tenant_code'], 'PACS-MANDYA-001')

    def test_api_verify_proof_endpoint(self):
        """Tests REST API endpoint for verifying Merkle proofs."""
        seal_next_block(tenant=self.tenant_a, difficulty=2)
        tx = record_ledger_transaction(tenant=self.tenant_a, tx_type='DEPOSIT', entity_type='Savings', entity_id='99')
        b1 = seal_next_block(tenant=self.tenant_a, difficulty=2)
        tx.refresh_from_db()

        self.client.force_authenticate(user=self.admin_a)
        res = self.client.post('/api/v1/audit/blockchain/verify-proof/', {
            'leaf_hash': tx.tx_hash,
            'merkle_proof': tx.merkle_proof,
            'expected_root': b1.merkle_root
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['is_valid'])
        self.assertEqual(res.data['status'], 'VERIFIED')
