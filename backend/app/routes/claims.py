from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.all_models import Claim, Review, PolicyEvidence, ValidationResult, ReviewDecision, AuditLog, PolicySection, Policy
from app.schemas.claim import ClaimCreate, ClaimRead
from app.schemas.review import (
    ReviewRead, PolicyEvidenceRead, ReviewDecisionRead,
    ReviewerActionApprove, ReviewerActionReject, ReviewerActionClarification, ReviewerActionOverride
)
from app.schemas.validation import ValidationResultRead
from app.schemas.audit import AuditLogRead
from app.services.claims.workflow import (
    process_new_claim, approve_claim_workflow, reject_claim_workflow,
    request_clarification_workflow, override_category_workflow
)

router = APIRouter(prefix="/api/claims", tags=["Claims"])


@router.post("", response_model=ClaimRead, status_code=status.HTTP_201_CREATED)
def submit_claim(claim_in: ClaimCreate, db: Session = Depends(get_db)):
    """Submit a new expense claim, run deterministic checks & AI policy review workflow."""
    claim = process_new_claim(db, claim_in)
    return claim


@router.get("", response_model=List[ClaimRead])
def list_claims(
    search: Optional[str] = Query(None, description="Search claimant or description"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by claim status"),
    category_filter: Optional[str] = Query(None, alias="category", description="Filter by category"),
    sort_by: str = Query("created_at", description="Field to sort by: created_at, amount, date"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    db: Session = Depends(get_db)
):
    """List all expense claims with optional filtering and sorting."""
    query = db.query(Claim)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter((Claim.claimant.ilike(term)) | (Claim.description.ilike(term)))

    if status_filter and status_filter.strip() and status_filter.upper() != "ALL":
        query = query.filter(Claim.status == status_filter.upper())

    if category_filter and category_filter.strip() and category_filter.upper() != "ALL":
        query = query.filter(Claim.category.ilike(category_filter.strip()))

    if sort_by == "amount":
        query = query.order_by(desc(Claim.amount) if sort_order == "desc" else Claim.amount)
    elif sort_by == "date":
        query = query.order_by(desc(Claim.date) if sort_order == "desc" else Claim.date)
    else:
        query = query.order_by(desc(Claim.created_at) if sort_order == "desc" else Claim.created_at)

    return query.all()


@router.get("/{claim_id}")
def get_claim_detail(claim_id: int, db: Session = Depends(get_db)):
    """Get full details of a single claim including validation checks, AI review, evidence, decisions, and audit history."""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    validation_results = db.query(ValidationResult).filter(ValidationResult.claim_id == claim_id).all()
    review = db.query(Review).filter(Review.claim_id == claim_id).first()

    evidences_data = []
    review_data = None
    if review:
        evidences = db.query(PolicyEvidence).filter(PolicyEvidence.review_id == review.id).all()
        for ev in evidences:
            sec = db.query(PolicySection).filter(PolicySection.id == ev.policy_section_id).first() if ev.policy_section_id else None
            policy = db.query(Policy).filter(Policy.id == sec.policy_id).first() if sec else None
            evidences_data.append({
                "id": ev.id,
                "review_id": ev.review_id,
                "policy_section_id": ev.policy_section_id,
                "evidence_text": ev.evidence_text,
                "relevance": ev.relevance,
                "section_number": sec.section_number if sec else "N/A",
                "section_title": sec.title if sec else "Policy Guideline",
                "policy_name": policy.name if policy else "Travel & Expense Policy",
                "policy_version": policy.version if policy else "2.1"
            })

        review_data = {
            "id": review.id,
            "claim_id": review.claim_id,
            "ai_category": review.ai_category,
            "confidence": review.confidence,
            "uncertain": review.uncertain,
            "status": review.status,
            "explanation": review.explanation,
            "missing_information": review.get_missing_info(),
            "created_at": review.created_at,
            "evidences": evidences_data
        }

    decisions = db.query(ReviewDecision).filter(ReviewDecision.claim_id == claim_id).order_by(ReviewDecision.created_at.desc()).all()
    audit_logs = db.query(AuditLog).filter(AuditLog.claim_id == claim_id).order_by(AuditLog.timestamp.asc()).all()

    return {
        "claim": ClaimRead.model_validate(claim),
        "validations": [ValidationResultRead.model_validate(v) for v in validation_results],
        "review": review_data,
        "decisions": [ReviewDecisionRead.model_validate(d) for d in decisions],
        "audit_logs": [AuditLogRead.model_validate(a) for a in audit_logs]
    }


@router.post("/{claim_id}/approve", response_model=ClaimRead)
def approve_claim(claim_id: int, payload: ReviewerActionApprove, db: Session = Depends(get_db)):
    """Reviewer approves a claim."""
    return approve_claim_workflow(db, claim_id, payload.reviewer, payload.reason)


@router.post("/{claim_id}/reject", response_model=ClaimRead)
def reject_claim(claim_id: int, payload: ReviewerActionReject, db: Session = Depends(get_db)):
    """Reviewer rejects a claim (requires reason)."""
    return reject_claim_workflow(db, claim_id, payload.reviewer, payload.reason)


@router.post("/{claim_id}/clarification", response_model=ClaimRead)
def request_clarification(claim_id: int, payload: ReviewerActionClarification, db: Session = Depends(get_db)):
    """Reviewer requests clarification for a claim."""
    return request_clarification_workflow(db, claim_id, payload.reviewer, payload.message)


@router.post("/{claim_id}/override", response_model=ClaimRead)
def override_classification(claim_id: int, payload: ReviewerActionOverride, db: Session = Depends(get_db)):
    """Reviewer overrides AI classification for a claim (requires new_category & reason)."""
    return override_category_workflow(db, claim_id, payload.reviewer, payload.new_category, payload.reason)


@router.get("/{claim_id}/history", response_model=List[AuditLogRead])
def get_claim_history(claim_id: int, db: Session = Depends(get_db)):
    """Get complete audit log timeline for a claim."""
    logs = db.query(AuditLog).filter(AuditLog.claim_id == claim_id).order_by(AuditLog.timestamp.asc()).all()
    return logs
