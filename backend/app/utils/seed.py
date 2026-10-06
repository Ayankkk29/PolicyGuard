from sqlalchemy.orm import Session
from app.database.session import SessionLocal, engine, Base
from app.models.all_models import Policy, PolicySection, Claim
from app.schemas.claim import ClaimCreate
from app.services.claims.workflow import process_new_claim

def seed_database():
    """Seed initial policy and demonstration claims into the database."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if policy already exists
        existing_policy = db.query(Policy).filter(Policy.name == "Travel & Expense Policy").first()
        if not existing_policy:
            print("Seeding Policy v2.1...")
            policy = Policy(
                name="Travel & Expense Policy",
                version="2.1",
                description="Standard organizational guidelines for business travel, meals, accommodation, and general employee expenses.",
                effective_date="2026-01-01",
                is_active=True
            )
            db.add(policy)
            db.commit()
            db.refresh(policy)

            sections = [
                PolicySection(
                    policy_id=policy.id,
                    section_number="1.1",
                    title="General Expense Rules",
                    content="All expense claims must specify claimant name, valid expense date, category, positive claim amount, currency, and business description. Claims must be submitted within 30 days of expense incurring.",
                    category="General",
                    tags="general,rules,date,amount"
                ),
                PolicySection(
                    policy_id=policy.id,
                    section_number="2.1",
                    title="Receipts Requirement",
                    content="Receipts are strictly mandatory for all expense claims exceeding ₹1,000 or for any hotel accommodation claim regardless of amount. Failure to provide a valid itemized receipt for mandatory claims will result in rejection.",
                    category="Receipts",
                    tags="receipt,bill,proof"
                ),
                PolicySection(
                    policy_id=policy.id,
                    section_number="3.2",
                    title="Meal Expenses",
                    content="Meal expenses are limited to ₹2,000 per day. Meals with clients must state client name or clear business purpose in the description.",
                    category="Meals",
                    tags="food,dinner,lunch,breakfast,meals,client"
                ),
                PolicySection(
                    policy_id=policy.id,
                    section_number="4.1",
                    title="Accommodation",
                    content="Hotel and accommodation expenses are limited to ₹5,000 per night. Original itemized lodging receipt is strictly required for all accommodation claims.",
                    category="Accommodation",
                    tags="hotel,accommodation,stay,lodging"
                ),
                PolicySection(
                    policy_id=policy.id,
                    section_number="5.1",
                    title="Transportation",
                    content="Local transportation (taxis, ride shares, public transit) is limited to ₹1,500 per day. Business travel location and purpose must be provided.",
                    category="Transportation",
                    tags="taxi,uber,transit,cab,flight,transportation"
                ),
                PolicySection(
                    policy_id=policy.id,
                    section_number="6.1",
                    title="Business Travel",
                    content="Intercity flight or train travel must be pre-approved by line manager. Receipts and travel itinerary documents must be attached.",
                    category="Travel",
                    tags="travel,flight,train,intercity"
                )
            ]
            db.add_all(sections)
            db.commit()
            print("Policy v2.1 seeded successfully.")

        # Check if claims already exist
        claim_count = db.query(Claim).count()
        if claim_count == 0:
            print("Seeding sample claims...")
            sample_claims = [
                # Scenario 1: Valid Meal Claim
                ClaimCreate(
                    claimant="Rahul Sharma",
                    date="2026-10-02",
                    category="Meals",
                    amount=1850.0,
                    currency="INR",
                    description="Dinner with client at hotel",
                    receipt_available=True
                ),
                # Scenario 2: Meal Over Limit
                ClaimCreate(
                    claimant="Anita Roy",
                    date="2026-10-02",
                    category="Meals",
                    amount=3500.0,
                    currency="INR",
                    description="Executive lunch meeting with key client team",
                    receipt_available=True
                ),
                # Scenario 3: Ambiguous Description
                ClaimCreate(
                    claimant="Vikram Patel",
                    date="2026-10-03",
                    category="Meals",
                    amount=800.0,
                    currency="INR",
                    description="Meeting expense",
                    receipt_available=True
                ),
                # Sample Claim 4: Missing Receipt
                ClaimCreate(
                    claimant="Sneha Gupta",
                    date="2026-10-01",
                    category="Accommodation",
                    amount=4500.0,
                    currency="INR",
                    description="Hotel stay for tech conference in Bangalore",
                    receipt_available=False
                ),
                # Sample Claim 5: Duplicate Claim
                ClaimCreate(
                    claimant="Rahul Sharma",
                    date="2026-10-02",
                    category="Meals",
                    amount=1850.0,
                    currency="INR",
                    description="Dinner with client at hotel",
                    receipt_available=True
                ),
                # Sample Claim 6: Valid Transportation Claim
                ClaimCreate(
                    claimant="David Miller",
                    date="2026-10-03",
                    category="Transportation",
                    amount=1200.0,
                    currency="INR",
                    description="Taxi from airport to client site and hotel return",
                    receipt_available=True
                )
            ]

            for claim_data in sample_claims:
                process_new_claim(db, claim_data)

            print("Sample claims seeded successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
