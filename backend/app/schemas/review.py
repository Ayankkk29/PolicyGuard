from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class PolicyEvidenceRead(BaseModel):
    id: int
    review_id: int
    policy_section_id: Optional[int] = None
    evidence_text: str
    relevance: float
    section_number: Optional[str] = None
    section_title: Optional[str] = None
    policy_name: Optional[str] = None
    policy_version: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewRead(BaseModel):
    id: int
    claim_id: int
    ai_category: Optional[str] = None
    confidence: float
    uncertain: bool
    status: str
    explanation: str
    missing_information: List[str] = Field(default_factory=list)
    created_at: datetime
    evidences: List[PolicyEvidenceRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ReviewDecisionRead(BaseModel):
    id: int
    claim_id: int
    decision: str
    reason: str
    reviewer: str
    override_category: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Reviewer Action Payloads
class ReviewerActionApprove(BaseModel):
    reviewer: str = Field(default="Reviewer John", description="Name of reviewer")
    reason: Optional[str] = Field(default="Approved after manual policy compliance check", description="Optional approval notes")


class ReviewerActionReject(BaseModel):
    reviewer: str = Field(default="Reviewer John", description="Name of reviewer")
    reason: str = Field(..., min_length=3, description="Mandatory reason for rejection")


class ReviewerActionClarification(BaseModel):
    reviewer: str = Field(default="Reviewer John", description="Name of reviewer")
    message: str = Field(..., min_length=3, description="Mandatory clarification request text")


class ReviewerActionOverride(BaseModel):
    reviewer: str = Field(default="Reviewer John", description="Name of reviewer")
    new_category: str = Field(..., min_length=1, description="New overridden category")
    reason: str = Field(..., min_length=5, description="Mandatory explanation for overriding AI classification")
