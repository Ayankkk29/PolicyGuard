from pydantic import BaseModel
from typing import List, Dict, Any

class CategoryBreakdown(BaseModel):
    category: str
    count: int
    total_amount: float

class StatusBreakdown(BaseModel):
    status: str
    count: int

class DashboardStatsRead(BaseModel):
    total_claims: int
    pending_reviews: int
    approved_claims: int
    rejected_claims: int
    requires_clarification: int
    needs_review: int
    total_amount: float
    status_counts: Dict[str, int]
    category_breakdown: List[CategoryBreakdown]
