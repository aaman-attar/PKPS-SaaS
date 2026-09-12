import hashlib
import json
from django.utils import timezone
from .models import AuditLog

def compute_hash(timestamp_str, user_id, action, entity_id, new_values, prev_hash):
    payload = f"{timestamp_str}|{user_id}|{action}|{entity_id}|{json.dumps(new_values, sort_keys=True)}|{prev_hash}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def record_audit(user, action, module, entity_name, entity_id, old_values=None, new_values=None, ip_address=None):
    tenant = getattr(user, 'tenant', None) if user and user.is_authenticated else None
    user_id_str = str(user.id) if user and user.is_authenticated else 'SYSTEM'
    
    last_log = AuditLog.objects.filter(tenant=tenant).order_by('-timestamp').first()
    prev_hash = last_log.hash if last_log else '0' * 64

    now = timezone.now()
    now_str = now.isoformat()
    
    current_hash = compute_hash(now_str, user_id_str, action, str(entity_id), new_values or {}, prev_hash)

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
        hash=current_hash,
        timestamp=now
    )
    return log
