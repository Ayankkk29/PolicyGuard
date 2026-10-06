def test_claim_submission_and_approve(client):
    payload = {
        "claimant": "Rahul Sharma",
        "date": "2026-10-02",
        "category": "Meals",
        "amount": 1850.0,
        "currency": "INR",
        "description": "Dinner with client at hotel",
        "receipt_available": True
    }
    resp = client.post("/api/claims", json=payload)
    assert resp.status_code == 201
    claim_data = resp.json()
    claim_id = claim_data["id"]
    assert claim_data["status"] == "AI_REVIEWED"

    # Approve claim
    approve_resp = client.post(f"/api/claims/{claim_id}/approve", json={"reviewer": "Reviewer John", "reason": "Approved"})
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "APPROVED"

    # Check history
    hist_resp = client.get(f"/api/claims/{claim_id}/history")
    assert hist_resp.status_code == 200
    actions = [h["action"] for h in hist_resp.json()]
    assert "REVIEWER_APPROVED" in actions

def test_claim_reject_requires_reason(client):
    payload = {
        "claimant": "Anita Roy",
        "date": "2026-10-02",
        "category": "Meals",
        "amount": 3500.0,
        "currency": "INR",
        "description": "Executive lunch",
        "receipt_available": True
    }
    resp = client.post("/api/claims", json=payload)
    claim_id = resp.json()["id"]

    # Reject without reason should fail
    bad_reject = client.post(f"/api/claims/{claim_id}/reject", json={"reviewer": "Reviewer John", "reason": ""})
    assert bad_reject.status_code in [400, 422]

    # Reject with valid reason
    good_reject = client.post(f"/api/claims/{claim_id}/reject", json={"reviewer": "Reviewer John", "reason": "Exceeds limit"})
    assert good_reject.status_code == 200
    assert good_reject.json()["status"] == "REJECTED"

def test_override_classification(client):
    payload = {
        "claimant": "David Miller",
        "date": "2026-10-02",
        "category": "Meals",
        "amount": 1200.0,
        "currency": "INR",
        "description": "Cab ride from airport to office",
        "receipt_available": True
    }
    resp = client.post("/api/claims", json=payload)
    claim_id = resp.json()["id"]

    # Override category to Transportation
    override_payload = {
        "reviewer": "Reviewer John",
        "new_category": "Transportation",
        "reason": "Description and receipt confirm expense was for taxi ride."
    }
    ov_resp = client.post(f"/api/claims/{claim_id}/override", json=override_payload)
    assert ov_resp.status_code == 200
    assert ov_resp.json()["category"] == "Transportation"

    # Verify original AI classification is preserved in detail view
    detail_resp = client.get(f"/api/claims/{claim_id}")
    assert detail_resp.status_code == 200
    # Original AI classification remains intact
    assert detail_resp.json()["review"]["ai_category"] is not None
    # Check decision record stored override
    decisions = detail_resp.json()["decisions"]
    assert any(d["decision"] == "OVERRIDDEN" and d["override_category"] == "Transportation" for d in decisions)
