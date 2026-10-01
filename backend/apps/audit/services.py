import hashlib
import json
from django.db import transaction
from django.utils import timezone
from .models import AuditLog

def compute_hash(timestamp_str, user_id, action, entity_id, new_values, prev_hash):
    payload = f"{timestamp_str}|{user_id}|{action}|{entity_id}|{json.dumps(new_values, sort_keys=True)}|{prev_hash}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def record_audit(user, action, module, entity_name, entity_id, old_values=None, new_values=None, ip_address=None):
    try:
        tenant = getattr(user, 'tenant', None) if user and user.is_authenticated else None
        user_id_str = str(user.id) if user and user.is_authenticated else 'SYSTEM'

        with transaction.atomic():
            # Concurrency-safe hash chain calculation with row locking
            last_log = AuditLog.objects.select_for_update().filter(tenant=tenant).order_by('-timestamp', '-id').first()
            prev_hash = last_log.hash if last_log else '0' * 64

            log = AuditLog.objects.create(
                tenant=tenant,
                user=user if user and user.is_authenticated else None,
                action=action,
                module=module,
                entity_name=entity_name,
                entity_id=str(entity_id),
                old_values=old_values,
                new_values=new_values,
                ip_address=ip_address,
                previous_hash=prev_hash,
                hash='0' * 64
            )
            # Refresh to get exact database-persisted timestamp format
            log.refresh_from_db()

            current_hash = compute_hash(
                log.timestamp.isoformat(),
                user_id_str,
                action,
                str(entity_id),
                new_values or {},
                prev_hash
            )
            AuditLog.objects.filter(id=log.id).update(hash=current_hash)
            log.hash = current_hash

            # Also record into Blockchain Ledger Pool for cryptographic Merkle sealing
            try:
                from .blockchain_service import record_ledger_transaction
                amt = 0.00
                if new_values and 'amount' in new_values:
                    try:
                        amt = float(new_values['amount'])
                    except (ValueError, TypeError):
                        pass
                record_ledger_transaction(
                    tenant=tenant,
                    tx_type=action,
                    entity_type=entity_name,
                    entity_id=str(entity_id),
                    amount=amt,
                    actor=user if user and user.is_authenticated else None,
                    payload={'module': module, 'action': action, 'new_values': new_values}
                )
            except Exception as b_err:
                print(f"[BLOCKCHAIN LEDGER POOL ERROR] {b_err}")

            return log
    except Exception as e:
        print(f"[AUDIT LOG ERROR] Failed to record audit: {e}")
        return None
