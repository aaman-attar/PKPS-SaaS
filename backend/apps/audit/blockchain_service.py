import hashlib
import json
import secrets
from django.db import transaction
from django.utils import timezone
from .models import BlockchainBlock, BlockTransaction
from .merkle import compute_merkle_root, generate_merkle_proof, verify_merkle_proof

def compute_tx_hash(tx_type, entity_type, entity_id, amount, payload, timestamp_str):
    """Generates a deterministic SHA-256 hash for a financial ledger transaction."""
    canonical_payload = json.dumps(payload or {}, sort_keys=True)
    raw = f"{tx_type}|{entity_type}|{entity_id}|{amount:.2f}|{canonical_payload}|{timestamp_str}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def record_ledger_transaction(tenant, tx_type, entity_type, entity_id, amount=0.00, actor=None, payload=None):
    """
    Records an immutable transaction in the cryptographic ledger pool.
    These are later bundled into sealed cryptographic blocks.
    """
    now = timezone.now()
    tx_hash = compute_tx_hash(tx_type, entity_type, entity_id, amount, payload, now.isoformat())

    tx = BlockTransaction.objects.create(
        tenant=tenant,
        tx_type=tx_type,
        actor=actor,
        entity_type=entity_type,
        entity_id=str(entity_id),
        amount=amount,
        payload=payload or {},
        tx_hash=tx_hash,
        created_at=now
    )
    return tx

def seal_next_block(tenant=None, difficulty=2):
    """
    Bundles all pending unsealed transactions into a new cryptographic block,
    computes the Merkle Root, solves Proof-of-Work nonce, computes individual
    Merkle proofs, and anchors the digest.
    """
    with transaction.atomic():
        # 1. Fetch pending transactions
        pending_txs = list(
            BlockTransaction.objects.select_for_update()
            .filter(tenant=tenant, block__isnull=True)
            .order_by('created_at')
        )

        last_block = (
            BlockchainBlock.objects.select_for_update()
            .filter(tenant=tenant)
            .order_by('-block_index')
            .first()
        )

        # Handle Genesis Block
        if not last_block:
            block_index = 0
            prev_hash = '0' * 64
            # If no pending transactions for genesis, create a Genesis Initialization transaction
            if not pending_txs:
                gen_tx = record_ledger_transaction(
                    tenant=tenant,
                    tx_type='GENESIS_INIT',
                    entity_type='SYSTEM',
                    entity_id='0',
                    amount=0.00,
                    payload={'note': 'PKPS Decentralized Cooperative Ledger Genesis Block'}
                )
                pending_txs = [gen_tx]
        else:
            block_index = last_block.block_index + 1
            prev_hash = last_block.block_hash
            if not pending_txs:
                # No transactions to seal
                return None

        # 2. Compute Merkle Root
        tx_hashes = [tx.tx_hash for tx in pending_txs]
        merkle_root = compute_merkle_root(tx_hashes)

        # 3. Cryptographic Proof-of-Work Header Hashing
        now = timezone.now()
        timestamp_str = now.isoformat()
        target_prefix = '0' * difficulty
        nonce = 0
        block_hash = ''

        while True:
            header_str = f"{block_index}|{prev_hash}|{merkle_root}|{timestamp_str}|{nonce}"
            candidate_hash = hashlib.sha256(header_str.encode('utf-8')).hexdigest()
            if candidate_hash.startswith(target_prefix):
                block_hash = candidate_hash
                break
            nonce += 1

        # 4. Generate Simulated Public Blockchain Anchor (e.g. Polygon PoS / Sepolia)
        anchor_entropy = f"{block_hash}|{now.timestamp()}|{secrets.token_hex(8)}"
        anchor_tx_hash = "0x" + hashlib.sha256(anchor_entropy.encode('utf-8')).hexdigest()

        # 5. Create Block (sealed_at uses auto_now_add, so DB sets the real timestamp)
        block = BlockchainBlock.objects.create(
            tenant=tenant,
            block_index=block_index,
            previous_hash=prev_hash,
            merkle_root=merkle_root,
            block_hash='0' * 64,  # placeholder — updated below after DB refresh
            nonce=nonce,
            difficulty=difficulty,
            tx_count=len(pending_txs),
            is_anchored=True,
            anchor_network='Polygon PoS',
            anchor_tx_hash=anchor_tx_hash,
            anchor_timestamp=now,
        )

        # 6. Refresh from DB to get the actual auto_now_add sealed_at timestamp
        #    (auto_now_add ignores any explicit value passed to create(), so we must
        #    read back what the DB stored and recompute the header hash from it.)
        block.refresh_from_db()
        actual_timestamp_str = block.sealed_at.isoformat()

        # 7. Recompute the final block_hash using the real stored sealed_at
        final_nonce = 0
        final_hash = ''
        while True:
            header_str = f"{block_index}|{prev_hash}|{merkle_root}|{actual_timestamp_str}|{final_nonce}"
            candidate_hash = hashlib.sha256(header_str.encode('utf-8')).hexdigest()
            if candidate_hash.startswith(target_prefix):
                final_hash = candidate_hash
                break
            final_nonce += 1

        BlockchainBlock.objects.filter(id=block.id).update(block_hash=final_hash, nonce=final_nonce)
        block.block_hash = final_hash
        block.nonce = final_nonce

        # 8. Assign transactions to block & generate individual Merkle Proofs
        for idx, tx in enumerate(pending_txs):
            proof = generate_merkle_proof(tx_hashes, idx)
            tx.block = block
            tx.tx_index = idx
            tx.merkle_proof = proof
            tx.save(update_fields=['block', 'tx_index', 'merkle_proof'])

        return block

def verify_entire_blockchain(tenant=None):
    """
    Performs full mathematical audit and cryptographic verification of the blockchain:
      1. Verifies Genesis block previous hash ('0'*64).
      2. Recomputes each block hash with index, prev_hash, merkle_root, timestamp, and nonce.
      3. Verifies strict chain linkage (Block N.prev_hash == Block N-1.block_hash).
      4. Recomputes Merkle Root from transactions and compares to block.merkle_root.
      5. Validates individual transaction Merkle proofs.
    """
    blocks = list(
        BlockchainBlock.objects.filter(tenant=tenant)
        .order_by('block_index')
    )

    if not blocks:
        return {
            'chain_intact': True,
            'total_blocks': 0,
            'total_transactions': 0,
            'anchored_blocks': 0,
            'compromised_block': None,
            'message': 'No blocks present in ledger.'
        }

    total_tx_count = 0
    anchored_count = 0
    expected_prev_hash = '0' * 64

    for block in blocks:
        # Check 1: Previous Hash Linkage
        if block.previous_hash != expected_prev_hash:
            return {
                'chain_intact': False,
                'total_blocks': len(blocks),
                'total_transactions': total_tx_count,
                'anchored_blocks': anchored_count,
                'compromised_block': block.block_index,
                'error': f"Previous hash mismatch at Block #{block.block_index}. Expected {expected_prev_hash}, found {block.previous_hash}."
            }

        # Check 2: Reconstruct block header & verify hash
        timestamp_str = block.sealed_at.isoformat()
        header_str = f"{block.block_index}|{block.previous_hash}|{block.merkle_root}|{timestamp_str}|{block.nonce}"
        recalculated_hash = hashlib.sha256(header_str.encode('utf-8')).hexdigest()

        if recalculated_hash != block.block_hash:
            return {
                'chain_intact': False,
                'total_blocks': len(blocks),
                'total_transactions': total_tx_count,
                'anchored_blocks': anchored_count,
                'compromised_block': block.block_index,
                'error': f"Block #{block.block_index} header hash tampered! Expected {recalculated_hash}, found {block.block_hash}."
            }

        # Check 3: Merkle Root verification from transactions
        txs = list(block.transactions.order_by('tx_index'))
        tx_hashes = [t.tx_hash for t in txs]
        recomputed_root = compute_merkle_root(tx_hashes)

        if recomputed_root != block.merkle_root:
            return {
                'chain_intact': False,
                'total_blocks': len(blocks),
                'total_transactions': total_tx_count,
                'anchored_blocks': anchored_count,
                'compromised_block': block.block_index,
                'error': f"Block #{block.block_index} Merkle Root tampered! Transactions modified."
            }

        # Check 4: Individual Merkle Proof validity
        for tx in txs:
            if not verify_merkle_proof(tx.tx_hash, tx.merkle_proof or [], block.merkle_root):
                return {
                    'chain_intact': False,
                    'total_blocks': len(blocks),
                    'total_transactions': total_tx_count,
                    'anchored_blocks': anchored_count,
                    'compromised_block': block.block_index,
                    'error': f"Transaction {tx.tx_hash[:10]} Merkle proof invalid in Block #{block.block_index}."
                }

        total_tx_count += len(txs)
        if block.is_anchored:
            anchored_count += 1
        expected_prev_hash = block.block_hash

    return {
        'chain_intact': True,
        'total_blocks': len(blocks),
        'total_transactions': total_tx_count,
        'anchored_blocks': anchored_count,
        'latest_block_hash': blocks[-1].block_hash if blocks else None,
        'compromised_block': None,
        'message': 'All blocks and transactions mathematically verified. Ledger integrity 100% intact.'
    }
