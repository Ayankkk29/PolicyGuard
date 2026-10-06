from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.all_models import Claim
from app.schemas.dashboard import DashboardStatsRead, CategoryBreakdown

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardStatsRead)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get aggregated dashboard stats:
    - Total claims
    - Pending reviews
    - Approved claims
    - Rejected claims
    - Claims requiring clarification
    - Claims needing review
    - Total claimed amount
    - Category breakdown
    """
    total_claims = db.query(func.count(Claim.id)).scalar() or 0
    pending_reviews = db.query(func.count(Claim.id)).filter(Claim.status.in_(["PENDING", "AI_REVIEWED"])).scalar() or 0
    approved_claims = db.query(func.count(Claim.id)).filter(Claim.status == "APPROVED").scalar() or 0
    rejected_claims = db.query(func.count(Claim.id)).filter(Claim.status == "REJECTED").scalar() or 0
    requires_clarification = db.query(func.count(Claim.id)).filter(Claim.status == "REQUIRES_CLARIFICATION").scalar() or 0
    needs_review = db.query(func.count(Claim.id)).filter(Claim.status == "NEEDS_REVIEW").scalar() or 0
    total_amount = db.query(func.sum(Claim.amount)).scalar() or 0.0

    # Status counts map
    status_rows = db.query(Claim.status, func.count(Claim.id)).group_by(Claim.status).all()
    status_counts = {status: count for status, count in status_rows}

    # Category breakdown
    cat_rows = db.query(
        Claim.category,
        func.count(Claim.id).label("count"),
        func.sum(Claim.amount).label("total_amount")
    ).group_by(Claim.category).all()

    category_breakdown = [
        CategoryBreakdown(category=cat, count=cnt, total_amount=float(amt or 0.0))
        for cat, cnt, amt in cat_rows
    ]

    return DashboardStatsRead(
        total_claims=total_claims,
        pending_reviews=pending_reviews,
        approved_claims=approved_claims,
        rejected_claims=rejected_claims,
        requires_clarification=requires_clarification,
        needs_review=needs_review,
        total_amount=float(total_amount),
        status_counts=status_counts,
        category_breakdown=category_breakdown
    )
