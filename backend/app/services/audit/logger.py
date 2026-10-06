from sqlalchemy.orm import Session
from app.models.all_models import AuditLog
from typing import Optional

def log_audit(
    db: Session,
    claim_id: Optional[int],
    action: str,
    actor: str,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    reason: Optional[str] = None
) -> AuditLog:
    """Record an entry in the system audit log."""
    log_entry = AuditLog(
        claim_id=claim_id,
        action=action,
        actor=actor,
        old_value=old_value,
        new_value=new_value,
        reason=reason
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
