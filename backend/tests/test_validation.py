from app.schemas.claim import ClaimCreate
from app.services.validation.deterministic import run_deterministic_validations

def test_amount_validation_positive(db_session):
    claim = ClaimCreate(
        claimant="John Doe",
        date="2026-10-02",
        category="Meals",
        amount=1500.0,
        currency="INR",
        description="Client Dinner",
        receipt_available=True
    )
    results = run_deterministic_validations(db_session, claim)
    amt_res = next(r for r in results if r.check_type == "amount_validity")
    assert amt_res.status == "PASS"

def test_amount_validation_negative(db_session):
    claim = ClaimCreate(
        claimant="John Doe",
        date="2026-10-02",
        category="Meals",
        amount=-50.0,
        currency="INR",
        description="Client Dinner",
        receipt_available=True
    )
    results = run_deterministic_validations(db_session, claim)
    amt_res = next(r for r in results if r.check_type == "amount_validity")
    assert amt_res.status == "FAIL"

def test_category_limit_validation(db_session):
    # Meal limit is 2000 INR
    claim_under = ClaimCreate(
        claimant="Alice",
        date="2026-10-02",
        category="Meals",
        amount=1800.0,
        currency="INR",
        description="Team Lunch",
        receipt_available=True
    )
    res_under = run_deterministic_validations(db_session, claim_under)
    limit_res_under = next(r for r in res_under if r.check_type == "category_limit")
    assert limit_res_under.status == "PASS"

    claim_over = ClaimCreate(
        claimant="Bob",
        date="2026-10-02",
        category="Meals",
        amount=3500.0,
        currency="INR",
        description="Expensive Dinner",
        receipt_available=True
    )
    res_over = run_deterministic_validations(db_session, claim_over)
    limit_res_over = next(r for r in res_over if r.check_type == "category_limit")
    assert limit_res_over.status == "FAIL"
    assert "exceeds configured policy limit" in limit_res_over.message

def test_missing_receipt_validation(db_session):
    # Amount > 1000 requires receipt
    claim_no_receipt = ClaimCreate(
        claimant="Charlie",
        date="2026-10-02",
        category="Meals",
        amount=1500.0,
        currency="INR",
        description="Lunch",
        receipt_available=False
    )
    results = run_deterministic_validations(db_session, claim_no_receipt)
    rec_res = next(r for r in results if r.check_type == "receipt_check")
    assert rec_res.status == "FAIL"
    assert "Missing required receipt" in rec_res.message
