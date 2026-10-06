import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.all_models import Policy, PolicySection
from app.schemas.policy import PolicyCreate, PolicyRead, PolicySectionRead, PolicyTextImport
from app.services.audit.logger import log_audit

router = APIRouter(prefix="/api/policies", tags=["Policies"])


@router.get("", response_model=List[PolicyRead])
def list_policies(db: Session = Depends(get_db)):
    """List all organizational expense policies."""
    policies = db.query(Policy).order_by(desc(Policy.is_active), desc(Policy.created_at)).all()
    return policies


@router.post("", response_model=PolicyRead, status_code=status.HTTP_201_CREATED)
def create_policy(policy_in: PolicyCreate, db: Session = Depends(get_db)):
    """Create a new policy with sections and mark active."""
    # Deactivate existing active policies if any
    db.query(Policy).update({Policy.is_active: False})

    db_policy = Policy(
        name=policy_in.name,
        version=policy_in.version,
        description=policy_in.description,
        effective_date=policy_in.effective_date,
        is_active=True
    )
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)

    for sec_in in policy_in.sections:
        sec = PolicySection(
            policy_id=db_policy.id,
            section_number=sec_in.section_number,
            title=sec_in.title,
            content=sec_in.content,
            category=sec_in.category,
            tags=sec_in.tags
        )
        db.add(sec)

    db.commit()
    db.refresh(db_policy)

    log_audit(
        db=db,
        claim_id=None,
        action="POLICY_CREATED",
        actor="Admin",
        new_value=f"Policy '{db_policy.name}' v{db_policy.version} with {len(db_policy.sections)} sections"
    )

    return db_policy


@router.post("/import", response_model=PolicyRead, status_code=status.HTTP_201_CREATED)
def import_policy_text(payload: PolicyTextImport, db: Session = Depends(get_db)):
    """Import a policy document from raw text or markdown by parsing headers and sections."""
    db.query(Policy).update({Policy.is_active: False})

    db_policy = Policy(
        name=payload.name,
        version=payload.version,
        description=payload.description or "Imported policy document",
        effective_date=payload.effective_date,
        is_active=True
    )
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)

    # Parse sections from raw text looking for headers like "Section 1.1: Title" or "# 1.1 Title"
    lines = payload.raw_text.splitlines()
    current_sec_num = "1.0"
    current_title = "General Policy"
    current_content = []

    sec_count = 0
    for line in lines:
        match = re.match(r'^(?:#+|\bSection\b)?\s*([0-9]+\.[0-9]+)\s*[-:]?\s*(.*)$', line.strip(), re.IGNORECASE)
        if match:
            # Save previous section if content exists
            if current_content:
                sec_count += 1
                db.add(PolicySection(
                    policy_id=db_policy.id,
                    section_number=current_sec_num,
                    title=current_title,
                    content="\n".join(current_content).strip(),
                    category=current_title
                ))
                current_content = []

            current_sec_num = match.group(1)
            current_title = match.group(2).strip() or f"Section {current_sec_num}"
        else:
            current_content.append(line)

    if current_content:
        sec_count += 1
        db.add(PolicySection(
            policy_id=db_policy.id,
            section_number=current_sec_num,
            title=current_title,
            content="\n".join(current_content).strip(),
            category=current_title
        ))

    db.commit()
    db.refresh(db_policy)

    log_audit(
        db=db,
        claim_id=None,
        action="POLICY_IMPORTED",
        actor="Admin",
        new_value=f"Imported policy '{db_policy.name}' v{db_policy.version} with {sec_count} sections"
    )

    return db_policy


@router.get("/{policy_id}", response_model=PolicyRead)
def get_policy(policy_id: int, db: Session = Depends(get_db)):
    """Get single policy details with sections."""
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


@router.get("/{policy_id}/sections", response_model=List[PolicySectionRead])
def get_policy_sections(policy_id: int, db: Session = Depends(get_db)):
    """Get all sections of a policy."""
    sections = db.query(PolicySection).filter(PolicySection.policy_id == policy_id).order_by(PolicySection.section_number).all()
    return sections
