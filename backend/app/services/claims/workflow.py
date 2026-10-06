from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.all_models import (
    Claim, Review, PolicyEvidence, ValidationResult,
    ReviewDecision, AuditLog, PolicySection
)
from app.schemas.claim import ClaimCreate
from app.services.validation.deterministic import run_deterministic_validations
from app.services.policy.retrieval import retrieve_relevant_sections
from app.services.ai.reviewer import run_ai_review
from app.services.audit.logger import log_audit


def process_new_claim(db: Session, claim_data: ClaimCreate) -> Claim:
    """
    Complete claim intake and review workflow:
    1. Create Claim record (status: PENDING)
    2. Audit log: CLAIM_CREATED
    3. Run deterministic validation rules
    4. Retrieve relevant policy sections
    5. Run AI Review workflow
    6. Persist Review, PolicyEvidence, and ValidationResults
    7. Update claim status based on findings
    """
    # 1. Create Claim record
    db_claim = Claim(
        claimant=claim_data.claimant,
        date=claim_data.date,
        category=claim_data.category,
        amount=claim_data.amount,
        currency=claim_data.currency or "INR",
        description=claim_data.description,
        receipt_available=claim_data.receipt_available,
        status="PENDING"
    )
    db.add(db_claim)
    db.commit()
    db.refresh(db_claim)

    # 2. Audit log: CLAIM_CREATED
    log_audit(
        db=db,
        claim_id=db_claim.id,
        action="CLAIM_CREATED",
        actor=db_claim.claimant,
        new_value=f"Category: {db_claim.category}, Amount: {db_claim.currency} {db_claim.amount}",
        reason="Claim submitted into system"
    )

    # 3. Deterministic Validation
    val_results = run_deterministic_validations(db, claim_data, current_claim_id=db_claim.id)
    fail_messages = []
    for vr in val_results:
        vr.claim_id = db_claim.id
        db.add(vr)
        if vr.status == "FAIL":
            fail_messages.append(vr.message)
    
    db.commit()

    log_audit(
        db=db,
        claim_id=db_claim.id,
        action="DETERMINISTIC_VALIDATED",
        actor="System",
        new_value=f"Passed: {len([r for r in val_results if r.status == 'PASS'])}, Failures: {len(fail_messages)}"
    )

    # 4. Policy Retrieval
    relevant_sections = retrieve_relevant_sections(db, claim_data.category, claim_data.description, top_k=3)
    section_citations = [f"Sec {s.section_number}: {s.title}" for s in relevant_sections]

    log_audit(
        db=db,
        claim_id=db_claim.id,
        action="POLICY_RETRIEVED",
        actor="Policy Engine",
        new_value=f"Retrieved {len(relevant_sections)} sections: {', '.join(section_citations) if section_citations else 'None'}"
    )

    # 5. AI Review
    ai_result = run_ai_review(claim_data, relevant_sections, fail_messages)

    # 6. Save Review record
    review_obj = Review(
        claim_id=db_claim.id,
        ai_category=ai_result.get("category"),
        confidence=float(ai_result.get("confidence", 0.0)),
        uncertain=bool(ai_result.get("uncertain", False)),
        status=ai_result.get("status", "NEEDS_REVIEW"),
        explanation=ai_result.get("explanation", "")
    )
    review_obj.set_missing_info(ai_result.get("missing_information", []))
    db.add(review_obj)
    db.commit()
    db.refresh(review_obj)

    # Save Policy Evidence citations
    evidence_list = ai_result.get("policy_evidence", [])
    for ev in evidence_list:
        # Match back to policy section id if present
        sec_id = None
        matching_sec = next((s for s in relevant_sections if s.section_number == ev.get("section_number")), None)
        if matching_sec:
            sec_id = matching_sec.id
        
        pe = PolicyEvidence(
            review_id=review_obj.id,
            policy_section_id=sec_id,
            evidence_text=ev.get("quote", ""),
            relevance=float(ev.get("relevance", 0.90))
        )
        db.add(pe)

    db.commit()

    # 7. Update Claim status based on deterministic checks + AI status
    final_status = "AI_REVIEWED"
    if review_obj.uncertain or review_obj.status == "REQUIRES_CLARIFICATION":
        final_status = "REQUIRES_CLARIFICATION"
    elif fail_messages or review_obj.status in ["NEEDS_REVIEW", "NON_COMPLIANT"]:
        final_status = "NEEDS_REVIEW"

    db_claim.status = final_status
    db.commit()
    db.refresh(db_claim)

    log_audit(
        db=db,
        claim_id=db_claim.id,
        action="AI_REVIEWED",
        actor="PolicyGuard AI",
        new_value=f"Status: {final_status}, Predicted Category: {review_obj.ai_category}, Confidence: {review_obj.confidence*100:.1f}%",
        reason=review_obj.explanation
    )

    return db_claim


def approve_claim_workflow(db: Session, claim_id: int, reviewer: str, reason: Optional[str] = None) -> Claim:
    """Approve claim decision workflow."""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    old_status = claim.status
    claim.status = "APPROVED"

    decision = ReviewDecision(
        claim_id=claim.id,
        decision="APPROVED",
        reason=reason or "Claim approved after reviewer policy verification.",
        reviewer=reviewer
    )
    db.add(decision)
    db.commit()
    db.refresh(claim)

    log_audit(
        db=db,
        claim_id=claim.id,
        action="REVIEWER_APPROVED",
        actor=reviewer,
        old_value=old_status,
        new_value="APPROVED",
        reason=decision.reason
    )

    return claim


def reject_claim_workflow(db: Session, claim_id: int, reviewer: str, reason: str) -> Claim:
    """Reject claim decision workflow (requires non-empty reason)."""
    if not reason or not reason.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is mandatory.")

    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    old_status = claim.status
    claim.status = "REJECTED"

    decision = ReviewDecision(
        claim_id=claim.id,
        decision="REJECTED",
        reason=reason.strip(),
        reviewer=reviewer
    )
    db.add(decision)
    db.commit()
    db.refresh(claim)

    log_audit(
        db=db,
        claim_id=claim.id,
        action="REVIEWER_REJECTED",
        actor=reviewer,
        old_value=old_status,
        new_value="REJECTED",
        reason=reason.strip()
    )

    return claim


def request_clarification_workflow(db: Session, claim_id: int, reviewer: str, message: str) -> Claim:
    """Request clarification workflow."""
    if not message or not message.strip():
        raise HTTPException(status_code=400, detail="Clarification request message is mandatory.")

    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    old_status = claim.status
    claim.status = "REQUIRES_CLARIFICATION"

    # Update review missing info if review exists
    if claim.review:
        existing_info = claim.review.get_missing_info()
        existing_info.append(f"Reviewer request ({reviewer}): {message.strip()}")
        claim.review.set_missing_info(existing_info)

    decision = ReviewDecision(
        claim_id=claim.id,
        decision="REQUIRES_CLARIFICATION",
        reason=message.strip(),
        reviewer=reviewer
    )
    db.add(decision)
    db.commit()
    db.refresh(claim)

    log_audit(
        db=db,
        claim_id=claim.id,
        action="CLARIFICATION_REQUESTED",
        actor=reviewer,
        old_value=old_status,
        new_value="REQUIRES_CLARIFICATION",
        reason=message.strip()
    )

    return claim


def override_category_workflow(
    db: Session,
    claim_id: int,
    reviewer: str,
    new_category: str,
    reason: str
) -> Claim:
    """
    Override AI classification workflow.
    Requires new_category and reason.
    Preserves original AI review record in DB while updating claim category.
    """
    if not new_category or not new_category.strip():
        raise HTTPException(status_code=400, detail="New category is mandatory.")
    if not reason or not reason.strip():
        raise HTTPException(status_code=400, detail="Override explanation reason is mandatory.")

    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    old_category = claim.category
    claim.category = new_category.strip()

    decision = ReviewDecision(
        claim_id=claim.id,
        decision="OVERRIDDEN",
        reason=reason.strip(),
        reviewer=reviewer,
        override_category=new_category.strip()
    )
    db.add(decision)
    db.commit()

    # Re-run validations with updated category
    claim_create_obj = ClaimCreate(
        claimant=claim.claimant,
        date=claim.date,
        category=claim.category,
        amount=claim.amount,
        currency=claim.currency,
        description=claim.description,
        receipt_available=claim.receipt_available
    )
    
    # Delete old validation results and re-run
    db.query(ValidationResult).filter(ValidationResult.claim_id == claim.id).delete()
    db.commit()

    new_val_results = run_deterministic_validations(db, claim_create_obj, current_claim_id=claim.id)
    fail_messages = []
    for vr in new_val_results:
        vr.claim_id = claim.id
        db.add(vr)
        if vr.status == "FAIL":
            fail_messages.append(vr.message)
    
    db.commit()

    # Re-check claim status
    if fail_messages:
        claim.status = "NEEDS_REVIEW"
    else:
        claim.status = "AI_REVIEWED"

    db.commit()
    db.refresh(claim)

    log_audit(
        db=db,
        claim_id=claim.id,
        action="CLASSIFICATION_OVERRIDDEN",
        actor=reviewer,
        old_value=f"Category: {old_category}",
        new_value=f"Category: {new_category.strip()}",
        reason=reason.strip()
    )

    return claim
