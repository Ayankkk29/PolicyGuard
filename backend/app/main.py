from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.session import Base, engine
from app.routes import claims, policies, dashboard, audit

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Expense Claim Policy Review Assistant - Production REST API",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev/demo simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(claims.router)
app.include_router(policies.router)
app.include_router(dashboard.router)
app.include_router(audit.router)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "healthy",
        "version": "1.0.0",
        "docs": "/docs"
    }
