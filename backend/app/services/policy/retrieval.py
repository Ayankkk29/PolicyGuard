import re
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.models.all_models import Policy, PolicySection
from app.schemas.claim import ClaimCreate

def score_section(section: PolicySection, search_terms: List[str], claim_category: str) -> float:
    """Calculate relevance score for a policy section based on claim keywords and category."""
    score = 0.0
    category_lower = claim_category.lower()
    sec_cat_lower = (section.category or "").lower()
    title_lower = section.title.lower()
    content_lower = section.content.lower()

    # Exact or partial category match gets highest priority score
    if sec_cat_lower and (sec_cat_lower in category_lower or category_lower in sec_cat_lower):
        score += 5.0
    elif category_lower in title_lower:
        score += 4.0

    # Match search terms from description & category
    for term in search_terms:
        if len(term) < 3:
            continue
        term_lower = term.lower()
        if term_lower in title_lower:
            score += 2.0
        if term_lower in content_lower:
            score += 1.0
        if section.tags and term_lower in section.tags.lower():
            score += 1.5

    return score


def retrieve_relevant_sections(db: Session, category: str, description: str, top_k: int = 3) -> List[PolicySection]:
    """Retrieve top_k active policy sections most relevant to the given category and description."""
    active_policy = db.query(Policy).filter(Policy.is_active == True).order_by(Policy.created_at.desc()).first()
    if not active_policy:
        # Fallback to any policy if no active policy marked
        active_policy = db.query(Policy).order_by(Policy.created_at.desc()).first()

    if not active_policy:
        return []

    sections = db.query(PolicySection).filter(PolicySection.policy_id == active_policy.id).all()
    if not sections:
        return []

    # Extract query terms from category and description
    tokens = re.findall(r'\w+', f"{category} {description}")
    search_terms = list(set(tokens))

    scored_sections: List[Tuple[float, PolicySection]] = []
    for sec in sections:
        s = score_section(sec, search_terms, category)
        scored_sections.append((s, sec))

    # Sort descending by score
    scored_sections.sort(key=lambda x: x[0], reverse=True)

    # Return top_k sections (if top section score > 0, or fallback to first k)
    relevant = [sec for score, sec in scored_sections[:top_k]]
    return relevant
