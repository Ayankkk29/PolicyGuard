from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.all_models import Claim, ValidationResult, Policy, PolicySection
from app.schemas.claim import ClaimCreate

DEFAULT_CATEGORY_LIMITS = {
    "meals": 2000.0,
    "meal": 2000.0,
    "hotel": 5000.0,
    "accommodation": 5000.0,
    "transportation": 1500.0,
    "travel": 1500.0,
    "taxi": 1500.0
}

def get_policy_category_limit(db: Session, category: str) -> Optional[float]:
    """Extract category limit from active policy section content if present, else fallback to default."""
    cat_lower = category.lower()
    active_policy = db.query(Policy).filter(Policy.is_active == True).order_by(Policy.created_at.desc()).first()
    if active_policy:
        sections = db.query(PolicySection).filter(PolicySection.policy_id == active_policy.id).all()
        for sec in sections:
            sec_cat = (sec.category or "").lower()
            sec_text = sec.content.lower()
            if cat_lower in sec_cat or cat_lower in sec.title.lower():
                import re
                # Match pattern like ₹2,000 or 2,000 or 2000 per day/night
                matches = re.findall(r'₹?\s*([0-9,]+)\s*(?:per|\/)', sec.content)
                if matches:
                    try:
                        clean_num = float(matches[0].replace(',', ''))
                        return clean_num
                    except ValueError:
                        pass
    
    # Fallback to key lookup in DEFAULT_CATEGORY_LIMITS
    for key, val in DEFAULT_CATEGORY_LIMITS.items():
        if key in cat_lower:
            return val
    return None


def run_deterministic_validations(db: Session, claim: ClaimCreate, current_claim_id: Optional[int] = None) -> List[ValidationResult]:
    """
    Run all required deterministic validations on a claim:
    1. Required fields
    2. Valid amount (> 0)
    3. Valid date & future date policy
    4. Duplicate claim detection
    5. Receipt check based on policy rules
    6. Category limit validation
    """
    results: List[ValidationResult] = []

    # 1. Required fields check
    req_missing = []
    if not claim.claimant or not claim.claimant.strip():
        req_missing.append("claimant")
    if not claim.date or not claim.date.strip():
        req_missing.append("date")
    if not claim.category or not claim.category.strip():
        req_missing.append("category")
    if claim.amount is None:
        req_missing.append("amount")
    if not claim.description or not claim.description.strip():
        req_missing.append("description")

    if req_missing:
        results.append(ValidationResult(
            claim_id=current_claim_id or 0,
            check_type="required_fields",
            status="FAIL",
            message=f"Missing required fields: {', '.join(req_missing)}"
        ))
    else:
        results.append(ValidationResult(
            claim_id=current_claim_id or 0,
            check_type="required_fields",
            status="PASS",
            message="All required claim fields are provided."
        ))

    # 2. Amount validation
    if claim.amount is None or claim.amount <= 0:
        results.append(ValidationResult(
            claim_id=current_claim_id or 0,
            check_type="amount_validity",
            status="FAIL",
            message=f"Claim amount must be greater than zero. Received: {claim.amount}"
        ))
    else:
        results.append(ValidationResult(
            claim_id=current_claim_id or 0,
            check_type="amount_validity",
            status="PASS",
            message=f"Claim amount ({claim.currency} {claim.amount:,.2f}) is positive and valid."
        ))

    # 3. Date validation & Future Date policy check
    try:
        claim_dt = datetime.strptime(claim.date, "%Y-%m-%d").date()
        today_dt = datetime.utcnow().date()
        if claim_dt > today_dt:
            results.append(ValidationResult(
                claim_id=current_claim_id or 0,
                check_type="date_validity",
                status="WARNING",
                message=f"Claim date '{claim.date}' is in the future relative to today ({today_dt}). Future expenses require line manager verification."
            ))
        else:
            results.append(ValidationResult(
                claim_id=current_claim_id or 0,
                check_type="date_validity",
                status="PASS",
                message=f"Claim date '{claim.date}' is valid."
            ))
    except ValueError:
        results.append(ValidationResult(
            claim_id=current_claim_id or 0,
            check_type="date_validity",
            status="FAIL",
            message=f"Invalid date format '{claim.date}'. Required format: YYYY-MM-DD."
        ))

    # 4. Duplicate claim detection
    dup_query = db.query(Claim).filter(
        Claim.claimant == claim.claimant,
        Claim.date == claim.date,
        Claim.amount == claim.amount,
        Claim.currency == claim.currency,
        Claim.category == claim.category
    )
    if current_claim_id:
        dup_query = dup_query.filter(Claim.id != current_claim_id)
    
    dup_claim = dup_query.first()
    if dup_claim:
        results.append(ValidationResult(
            claim_id=current_claim_id or 0,
            check_type="duplicate_check",
            status="WARNING",
            message=f"Potential duplicate detected: Claim #{dup_claim.id} matching claimant '{claim.claimant}', amount {claim.currency} {claim.amount}, date '{claim.date}' already exists."
        ))
    else:
        results.append(ValidationResult(
            claim_id=current_claim_id or 0,
            check_type="duplicate_check",
            status="PASS",
            message="No duplicate claims found matching claimant, date, amount, and category."
        ))

    # 5. Receipt check based on policy rules
    # Policy rule: Receipts required for expenses > 1000 or Accommodation
    cat_lower = claim.category.lower()
    receipt_required_by_policy = False
    receipt_reason = ""

    if "hotel" in cat_lower or "accommodation" in cat_lower:
        receipt_required_by_policy = True
        receipt_reason = "Accommodation expenses strictly require itemized receipt."
    elif claim.amount > 1000.0:
        receipt_required_by_policy = True
        receipt_reason = "Policy requires receipts for any expense claim exceeding ₹1,000."

    if receipt_required_by_policy and not claim.receipt_available:
        results.append(ValidationResult(
            claim_id=current_claim_id or 0,
            check_type="receipt_check",
            status="FAIL",
            message=f"Missing required receipt: {receipt_reason} (receipt_available is False)."
        ))
    else:
        results.append(ValidationResult(
            claim_id=current_claim_id or 0,
            check_type="receipt_check",
            status="PASS",
            message="Receipt availability complies with policy rules."
        ))

    # 6. Category limit check
    limit = get_policy_category_limit(db, claim.category)
    if limit is not None:
        if claim.amount > limit:
            results.append(ValidationResult(
                claim_id=current_claim_id or 0,
                check_type="category_limit",
                status="FAIL",
                message=f"Claim amount of {claim.currency} {claim.amount:,.2f} exceeds configured policy limit of {claim.currency} {limit:,.2f} for '{claim.category}'."
            ))
        else:
            results.append(ValidationResult(
                claim_id=current_claim_id or 0,
                check_type="category_limit",
                status="PASS",
                message=f"Claim amount of {claim.currency} {claim.amount:,.2f} is within configured policy limit of {claim.currency} {limit:,.2f} for '{claim.category}'."
            ))
    else:
        results.append(ValidationResult(
            claim_id=current_claim_id or 0,
            check_type="category_limit",
            status="PASS",
            message=f"No specific numeric limit configured for category '{claim.category}'."
        ))

    return results
