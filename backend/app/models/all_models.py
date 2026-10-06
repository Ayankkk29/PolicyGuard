from datetime import datetime
import json
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    version = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    effective_date = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sections = relationship("PolicySection", back_populates="policy", cascade="all, delete-orphan")


class PolicySection(Base):
    __tablename__ = "policy_sections"

    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey("policies.id", ondelete="CASCADE"), nullable=False)
    section_number = Column(String, nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=True)
    tags = Column(Text, nullable=True) # JSON string or comma-separated

    policy = relationship("Policy", back_populates="sections")
    evidences = relationship("PolicyEvidence", back_populates="policy_section")


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claimant = Column(String, nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    description = Column(Text, nullable=False)
    receipt_available = Column(Boolean, default=False)
    status = Column(String, default="PENDING") # PENDING, AI_REVIEWED, REQUIRES_CLARIFICATION, NEEDS_REVIEW, APPROVED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)

    validation_results = relationship("ValidationResult", back_populates="claim", cascade="all, delete-orphan")
    review = relationship("Review", back_populates="claim", uselist=False, cascade="all, delete-orphan")
    decisions = relationship("ReviewDecision", back_populates="claim", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="claim", cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id", ondelete="CASCADE"), nullable=False, unique=True)
    ai_category = Column(String, nullable=True)
    confidence = Column(Float, nullable=False, default=0.0)
    uncertain = Column(Boolean, default=False)
    status = Column(String, nullable=False) # COMPLIANT, REQUIRES_CLARIFICATION, NEEDS_REVIEW, NON_COMPLIANT, UNCERTAIN
    explanation = Column(Text, nullable=False)
    missing_information = Column(Text, nullable=True) # JSON array string
    created_at = Column(DateTime, default=datetime.utcnow)

    claim = relationship("Claim", back_populates="review")
    evidences = relationship("PolicyEvidence", back_populates="review", cascade="all, delete-orphan")

    def set_missing_info(self, info_list: list):
        self.missing_information = json.dumps(info_list)

    def get_missing_info(self) -> list:
        if self.missing_information:
            try:
                return json.loads(self.missing_information)
            except Exception:
                return []
        return []


class PolicyEvidence(Base):
    __tablename__ = "policy_evidences"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    policy_section_id = Column(Integer, ForeignKey("policy_sections.id", ondelete="SET NULL"), nullable=True)
    evidence_text = Column(Text, nullable=False)
    relevance = Column(Float, default=1.0)

    review = relationship("Review", back_populates="evidences")
    policy_section = relationship("PolicySection", back_populates="evidences")


class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id", ondelete="CASCADE"), nullable=False)
    check_type = Column(String, nullable=False) # required_fields, amount_validity, date_validity, duplicate_check, receipt_check, category_limit
    status = Column(String, nullable=False) # PASS, FAIL, WARNING
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    claim = relationship("Claim", back_populates="validation_results")


class ReviewDecision(Base):
    __tablename__ = "review_decisions"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id", ondelete="CASCADE"), nullable=False)
    decision = Column(String, nullable=False) # APPROVED, REJECTED, REQUIRES_CLARIFICATION, OVERRIDDEN
    reason = Column(Text, nullable=False)
    reviewer = Column(String, default="Reviewer")
    override_category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    claim = relationship("Claim", back_populates="decisions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id", ondelete="CASCADE"), nullable=True)
    action = Column(String, nullable=False)
    actor = Column(String, nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    claim = relationship("Claim", back_populates="audit_logs")
