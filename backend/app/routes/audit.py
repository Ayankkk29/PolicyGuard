from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.all_models import AuditLog
from app.schemas.audit import AuditLogRead

router = APIRouter(prefix="/api/audit", tags=["Audit Log"])

@router.get("", response_model=List[AuditLogRead])
def get_global_audit_logs(
    claim_id: Optional[int] = Query(None, description="Filter by claim ID"),
    action: Optional[str] = Query(None, description="Filter by action name"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """List system audit log trail across all claims and actions."""
    query = db.query(AuditLog)
    if claim_id:
        query = query.filter(AuditLog.claim_id == claim_id)
    if action:
        query = query.filter(AuditLog.action == action)
    
    logs = query.order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return logs
