import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database.session import Base, get_db
from app.main import app
from app.models.all_models import Policy, PolicySection
from app.utils.seed import seed_database

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_policyguard.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create clean database for each test function."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Seed initial policy v2.1
    policy = Policy(
        name="Travel & Expense Policy",
        version="2.1",
        description="Test Policy",
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
            content="All expense claims must specify claimant name, valid expense date, category, positive claim amount, currency, and business description.",
            category="General"
        ),
        PolicySection(
            policy_id=policy.id,
            section_number="2.1",
            title="Receipts Requirement",
            content="Receipts are strictly mandatory for all expense claims exceeding ₹1,000 or for any hotel accommodation claim regardless of amount.",
            category="Receipts"
        ),
        PolicySection(
            policy_id=policy.id,
            section_number="3.2",
            title="Meal Expenses",
            content="Meal expenses are limited to ₹2,000 per day.",
            category="Meals"
        ),
        PolicySection(
            policy_id=policy.id,
            section_number="4.1",
            title="Accommodation",
            content="Hotel and accommodation expenses are limited to ₹5,000 per night.",
            category="Accommodation"
        ),
        PolicySection(
            policy_id=policy.id,
            section_number="5.1",
            title="Transportation",
            content="Local transportation is limited to ₹1,500 per day.",
            category="Transportation"
        )
    ]
    db.add_all(sections)
    db.commit()

    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden DB dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
