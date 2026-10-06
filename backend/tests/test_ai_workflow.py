from app.schemas.claim import ClaimCreate
from app.services.ai.reviewer import run_ai_review
from app.services.policy.retrieval import retrieve_relevant_sections

def test_confident_ai_classification(db_session):
    claim = ClaimCreate(
        claimant="Rahul Sharma",
        date="2026-10-02",
        category="Meals",
        amount=1850.0,
        currency="INR",
        description="Dinner with client at hotel",
        receipt_available=True
    )
    sections = retrieve_relevant_sections(db_session, claim.category, claim.description)
    result = run_ai_review(claim, sections, [])

    assert result["confidence"] > 0.8
    assert result["uncertain"] is False
    assert result["status"] == "COMPLIANT"
    assert len(result["policy_evidence"]) > 0

def test_uncertain_ai_classification_ambiguous(db_session):
    claim = ClaimCreate(
        claimant="Vikram Patel",
        date="2026-10-03",
        category="Meals",
        amount=800.0,
        currency="INR",
        description="Meeting expense",
        receipt_available=True
    )
    sections = retrieve_relevant_sections(db_session, claim.category, claim.description)
    result = run_ai_review(claim, sections, [])

    assert result["confidence"] < 0.5
    assert result["uncertain"] is True
    assert result["status"] == "REQUIRES_CLARIFICATION"
    assert len(result["missing_information"]) > 0
