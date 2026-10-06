import json
import logging
import re
from typing import List, Dict, Any, Optional
import httpx

from app.config import settings
from app.models.all_models import PolicySection
from app.schemas.claim import ClaimCreate

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are PolicyGuard AI, a strict corporate expense claim reviewer.
Your job is to review employee expense claims ONLY against the provided organizational policy sections.

CRITICAL RULES:
1. NEVER invent or assume policy rules that are not provided in the policy context.
2. If the claim description is vague or ambiguous (e.g. "Meeting expense", "Misc"), set "uncertain": true, "confidence": < 0.5, "category": null, status: "REQUIRES_CLARIFICATION", and provide specific "missing_information".
3. Evaluate whether the claim complies with limits and receipt requirements mentioned in the policy context.
4. Cite exact policy sections (section_number, title, quote) from the provided evidence context.
5. Return ONLY a valid JSON object with the exact schema requested below. Do NOT wrap in extra markdown or commentary outside the JSON block.

JSON SCHEMA:
{
  "category": "Meals" | "Accommodation" | "Transportation" | null,
  "confidence": 0.95,
  "uncertain": false,
  "status": "COMPLIANT" | "REQUIRES_CLARIFICATION" | "NEEDS_REVIEW" | "NON_COMPLIANT" | "UNCERTAIN",
  "explanation": "Clear, concise human-readable explanation citing policy rules.",
  "missing_information": ["List of missing details if any"],
  "policy_evidence": [
    {
      "section_number": "3.2",
      "title": "Meal Expenses",
      "quote": "Exact text quote from provided section.",
      "relevance": 0.95
    }
  ]
}
"""


def _generate_fallback_ai_review(
    claim: ClaimCreate,
    policy_sections: List[PolicySection],
    validation_failures: List[str]
) -> Dict[str, Any]:
    """
    Intelligent rule-based fallback AI reviewer when Gemini API key is not configured
    or when API call fails.
    """
    desc_lower = claim.description.lower()
    cat_lower = claim.category.lower()

    # Detect ambiguity (e.g. "meeting expense", "stuff", "misc", "dinner", "lunch" without details)
    vague_patterns = ["meeting expense", "misc", "miscellaneous", "office expense", "general expense", "spent money"]
    is_ambiguous = any(p in desc_lower for p in vague_patterns) or len(claim.description.strip()) < 8

    # Category prediction logic
    predicted_category = claim.category
    if "dinner" in desc_lower or "lunch" in desc_lower or "food" in desc_lower or "breakfast" in desc_lower:
        predicted_category = "Meals"
    elif "hotel" in desc_lower or "stay" in desc_lower or "room" in desc_lower:
        predicted_category = "Accommodation"
    elif "taxi" in desc_lower or "flight" in desc_lower or "cab" in desc_lower or "uber" in desc_lower or "train" in desc_lower:
        predicted_category = "Transportation"

    # Gather evidence quotes from sections
    evidences = []
    for sec in policy_sections:
        evidences.append({
            "section_number": sec.section_number,
            "title": sec.title,
            "quote": sec.content,
            "relevance": 0.95 if (sec.category and sec.category.lower() in predicted_category.lower()) else 0.80
        })

    if is_ambiguous:
        return {
            "category": None,
            "confidence": 0.42,
            "uncertain": True,
            "status": "REQUIRES_CLARIFICATION",
            "explanation": f"The claim description '{claim.description}' is ambiguous and does not specify sufficient details regarding the nature of the expense.",
            "missing_information": [
                "Additional information is required. Please specify whether this expense relates to meals, transportation, accommodation, or another business expense."
            ],
            "policy_evidence": evidences
        }

    # If there are validation failures (e.g., amount limit breach, missing receipt)
    if validation_failures:
        failure_reasons = "; ".join(validation_failures)
        return {
            "category": predicted_category,
            "confidence": 0.92,
            "uncertain": False,
            "status": "NEEDS_REVIEW",
            "explanation": f"Claim amount of {claim.currency} {claim.amount:,.2f} for '{predicted_category}' triggers policy compliance flags: {failure_reasons}.",
            "missing_information": [],
            "policy_evidence": evidences
        }

    # Compliant case
    primary_sec = policy_sections[0] if policy_sections else None
    sec_info = f"Section {primary_sec.section_number} ({primary_sec.title})" if primary_sec else "supplied policy guidelines"

    return {
        "category": predicted_category,
        "confidence": 0.94,
        "uncertain": False,
        "status": "COMPLIANT",
        "explanation": f"Claim amount is {claim.currency} {claim.amount:,.2f}. Based on {sec_info}, the expense is within configured policy limits and supporting information is complete.",
        "missing_information": [],
        "policy_evidence": evidences
    }


def call_gemini_api(prompt_text: str) -> Optional[str]:
    """Call Google Gemini REST API using HTTP POST if key is present."""
    api_key = settings.AI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return None

    model = settings.AI_MODEL or "gemini-2.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json"
        }
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text
            else:
                logger.error(f"Gemini API returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"Failed to call Gemini API: {e}")

    return None


import os

def run_ai_review(
    claim: ClaimCreate,
    policy_sections: List[PolicySection],
    validation_failures: List[str]
) -> Dict[str, Any]:
    """
    Main AI Review entrypoint.
    Runs policy-guided AI analysis and returns structured JSON review output.
    """
    # Format policy context string
    policy_context = ""
    for sec in policy_sections:
        policy_context += f"\n--- SECTION {sec.section_number}: {sec.title} ---\nCategory Tag: {sec.category or 'General'}\nContent:\n{sec.content}\n"

    user_prompt = f"""
CLAIM TO REVIEW:
- Claimant: {claim.claimant}
- Date: {claim.date}
- Submitted Category: {claim.category}
- Amount: {claim.currency} {claim.amount}
- Receipt Available: {claim.receipt_available}
- Description: "{claim.description}"

DETERMINISTIC VALIDATION FLAGS:
{json.dumps(validation_failures, indent=2) if validation_failures else "None"}

SUPPLIED POLICY SECTIONS CONTEXT:
{policy_context if policy_context else "No specific policy sections found."}

Inspect the claim strictly against the supplied policy context. Return the structured JSON response as instructed.
"""

    full_prompt = f"{SYSTEM_PROMPT}\n\n{user_prompt}"

    # Try calling Gemini API if key is present
    raw_response = call_gemini_api(full_prompt)

    if raw_response:
        try:
            # Clean response text if wrapped in ```json ... ```
            cleaned_text = raw_response.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]

            parsed_json = json.loads(cleaned_text.strip())

            # Validate mandatory schema fields
            if "confidence" in parsed_json and "explanation" in parsed_json:
                # Ensure policy_evidence has quotes
                if "policy_evidence" not in parsed_json or not parsed_json["policy_evidence"]:
                    evidences = []
                    for sec in policy_sections:
                        evidences.append({
                            "section_number": sec.section_number,
                            "title": sec.title,
                            "quote": sec.content,
                            "relevance": 0.90
                        })
                    parsed_json["policy_evidence"] = evidences
                return parsed_json
        except Exception as err:
            logger.error(f"Error parsing Gemini API JSON output: {err}. Raw text: {raw_response}")

    # Fallback reasoning engine if no key or error
    return _generate_fallback_ai_review(claim, policy_sections, validation_failures)
