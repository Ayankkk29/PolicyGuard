# PolicyGuard — Expense Claim Policy Review Assistant

![PolicyGuard Banner](https://img.shields.io/badge/PolicyGuard-AI--Powered%20Expense%20Audit-indigo?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-emerald?style=for-the-badge&logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![Pytest](https://img.shields.io/badge/Pytest-Passed%20100%25-brightgreen?style=for-the-badge&logo=pytest)

**PolicyGuard** is an enterprise-grade, full-stack internal web application designed to review employee expense claims against an organization's supplied expense policy. It combines **deterministic rule validation** for hard numerical/policy boundaries, **AI-assisted classification and policy evidence reasoning** via Google Gemini, **policy evidence citations**, **human reviewer overrides**, and a **complete audit trail**.

> **MANDATORY RESPONSIBLE AI DISCLAIMER**  
> *This application provides policy-based review assistance. It does not provide legal, tax, or formal compliance certification.*

---

## 🏗️ Architecture Overview

PolicyGuard isolates deterministic business rule validation from AI classification, ensuring that LLMs are never used for simple numeric math or strict hard constraints.

```mermaid
flowchart TD
    A[Employee / Reviewer] -->|Submit Expense Claim| B[Next.js 14 Frontend]
    B -->|REST API Request| C[FastAPI Backend Server]
    
    subgraph Backend Services
        C --> D[Deterministic Validation Engine]
        C --> E[Policy Evidence Retrieval Service]
        D -->|Pass / Fail / Warning| F[Claims Workflow Engine]
        E -->|Relevant Policy Sections| G[AI Reasoning Service - Gemini API]
        G -->|Structured JSON Result| F
    end

    subgraph Relational Database
        F --> H[(SQLAlchemy + SQLite / PostgreSQL)]
        H -->|Claims, Reviews, Evidences| C
        H -->|Audit Log Trail| C
    end
```

---

## ✨ Completed Scope vs Excluded Scope

### ✅ Completed Scope
1. **Claim Intake & Validation**: Complete support for `claimant`, `date`, `category`, `amount`, `currency`, `description`, `receipt_available`.
2. **Deterministic Business Rules**: Mandatory fields, positive amount check (`amount > 0`), valid date & future date policy warning, exact duplicate claim detection, policy-based receipt requirement check, category spending limits.
3. **AI-Assisted Workflow**: Ambiguous description classification, uncertainty flagging (`UNCERTAIN` / `REQUIRES_CLARIFICATION`), missing information prompt extraction, policy evidence section retrieval & citations.
4. **Human Reviewer Actions**: Approve, Reject (with mandatory reason), Request Clarification (with mandatory message), Override AI classification (with mandatory new category & reason, preserving original AI prediction record).
5. **Audit Trail & History**: Complete sequential timeline view of all intake, validation, AI analysis, and reviewer actions.
6. **Policy Library**: Active policy management, versioning (v2.1), section search, and raw text/markdown policy importer.
7. **Frontend Dashboard**: Total metrics, pending reviews, approved, rejected, category spend breakdown, search, status filtering, and sorting.

### 🚫 Intentionally Excluded Scope
- Actual financial reimbursement / bank payment processing.
- Payroll system integrations.
- Formal tax/legal compliance advice.
- Receipt OCR image scanning.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn, Pytest.
- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide React icons.
- **Database**: Relational SQLite (local/demo), architected with SQLAlchemy ORM for seamless PostgreSQL migration.
- **AI Integration**: Google Gemini API (`gemini-2.5-flash`) with structured JSON schema validation and rule-based fallback engine for 100% offline reliability.

---

## ⚡ Quick Start & Setup Instructions

### 1. Clone & Environment Setup
```bash
git clone <repository_url>
cd policyguard

# Copy environment variables example
cp .env.example .env
```

### 2. Backend Setup & Run
```bash
# Navigate to project root
cd policyguard

# Activate Python Virtual Environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Seed initial Policy v2.1 and sample claims
python -m app.utils.seed

# Launch FastAPI Backend Server
cd backend
uvicorn app.main:app --reload --port 8000
```
- **Backend API**: `http://localhost:8000`  
- **Swagger API Docs**: `http://localhost:8000/docs`

### 3. Frontend Setup & Run
Open a second terminal window:
```bash
cd policyguard/frontend

# Install dependencies
npm install

# Run Next.js Development Server
npm run dev
```
- **Frontend Web Dashboard**: `http://localhost:3000`

---

## 🧪 Running Automated Tests

Run the complete Pytest backend test suite:

```bash
cd policyguard/backend
..\venv\Scripts\pytest
```

---

## 🚀 Deployment Instructions

### Frontend (Vercel / Netlify)
1. Push project repository to GitHub.
2. Import `frontend/` directory into Vercel.
3. Configure Environment Variable:
   - `NEXT_PUBLIC_API_URL=https://your-backend-domain.com`
4. Deploy.

### Backend (Render / Railway / Fly.io / Docker)
1. Deploy `backend/` directory to Render / Railway / Docker container.
2. Set Build Command: `pip install -r backend/requirements.txt`
3. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Configure Environment Variables:
   - `DATABASE_URL=sqlite:///./policyguard.db` (or PostgreSQL URL `postgresql://user:pass@host/db`)
   - `AI_API_KEY=your_gemini_api_key`
   - `AI_MODEL=gemini-2.5-flash`
5. Execute seed command post-build: `python -m app.utils.seed`.

---

## 🎬 Recommended Assessment Reviewer Demo Flow

Test all required scenarios directly on `http://localhost:3000`:

### Scenario 1: Compliant Claim
1. Click **Submit New Claim**.
2. Enter Claimant: `Rahul Sharma`, Date: `2026-10-02`, Category: `Meals`, Amount: `1850`, Description: `"Dinner with client"`, Receipt: `Checked`.
3. **Outcome**: Deterministic checks PASS. AI predicts `Meals` with high confidence (>90%) citing Policy Section 3.2 (Limit ₹2,000). Status: `AI_REVIEWED`. Click **Approve**.

### Scenario 2: Limit Breach (Deterministic Failure)
1. Click **Submit New Claim**.
2. Enter Claimant: `Anita Roy`, Category: `Meals`, Amount: `3500`, Description: `"Executive lunch"`, Receipt: `Checked`.
3. **Outcome**: Category Limit check fails (₹3,500 > ₹2,000 limit). Status: `NEEDS_REVIEW`. Click **Reject** and provide reason.

### Scenario 3: Ambiguous Description (Uncertain AI)
1. Click **Submit New Claim**.
2. Enter Claimant: `Vikram Patel`, Category: `Meals`, Amount: `800`, Description: `"Meeting expense"`, Receipt: `Checked`.
3. **Outcome**: AI flags `UNCERTAIN CLASSIFICATION` with low confidence. Missing information box prompts for clarification. Status: `REQUIRES_CLARIFICATION`. Click **Request Clarification**.
