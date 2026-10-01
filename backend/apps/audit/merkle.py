import hashlib
import json

def sha256_hex(data):
    if isinstance(data, str):
        data = data.encode('utf-8')
    return hashlib.sha256(data).hexdigest()

def hash_pair(left, right):
    return sha256_hex(left + right)

def compute_merkle_root(leaf_hashes):
    """
    Computes the SHA-256 Merkle Root of an array of leaf transaction hashes.
    If the list is empty, returns 64 zeroes.
    If a level has an odd number of elements, the last element is duplicated.
    """
    if not leaf_hashes:
        return '0' * 64

    current_level = list(leaf_hashes)

    while len(current_level) > 1:
        next_level = []
        if len(current_level) % 2 != 0:
            current_level.append(current_level[-1])

        for i in range(0, len(current_level), 2):
            combined = hash_pair(current_level[i], current_level[i + 1])
            next_level.append(combined)

        current_level = next_level

    return current_level[0]

def generate_merkle_proof(leaf_hashes, target_index):
    """
    Generates a cryptographic Merkle Proof (audit path) for the transaction at target_index.
    Returns:
      [
        {"position": "right", "hash": "<sibling_hash>"},
        {"position": "left", "hash": "<sibling_hash>"},
        ...
      ]
    """
    if not leaf_hashes or target_index < 0 or target_index >= len(leaf_hashes):
        return []

    proof = []
    current_level = list(leaf_hashes)
    idx = target_index

    while len(current_level) > 1:
        if len(current_level) % 2 != 0:
            current_level.append(current_level[-1])

        # Sibling index
        if idx % 2 == 0:
            sibling_idx = idx + 1
            position = 'right'
        else:
            sibling_idx = idx - 1
            position = 'left'

        proof.append({
            'position': position,
            'hash': current_level[sibling_idx]
        })

        # Advance to next level
        next_level = []
        for i in range(0, len(current_level), 2):
            next_level.append(hash_pair(current_level[i], current_level[i + 1]))

        current_level = next_level
        idx = idx // 2

    return proof

def verify_merkle_proof(leaf_hash, proof, expected_root):
    """
    Cryptographically verifies whether a given leaf_hash belongs to the expected_root
    using the provided Merkle Proof path.
    """
    current_hash = leaf_hash

    for step in proof:
        sibling = step.get('hash', '')
        position = step.get('position', 'right')

        if position == 'left':
            current_hash = hash_pair(sibling, current_hash)
        else:
            current_hash = hash_pair(current_hash, sibling)

    return current_hash.lower() == expected_root.lower()
