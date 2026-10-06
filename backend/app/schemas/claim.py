from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime

class ClaimCreate(BaseModel):
    claimant: str = Field(..., min_length=1, description="Name of claimant")
    date: str = Field(..., description="Date of expense in YYYY-MM-DD format")
    category: str = Field(..., min_length=1, description="Category of expense e.g. Meals, Travel, Accommodation")
    amount: float = Field(..., description="Amount of expense")
    currency: str = Field(default="INR", description="Currency code")
    description: str = Field(..., min_length=1, description="Description of expense")
    receipt_available: bool = Field(default=False, description="Whether receipt is attached/available")

    @field_validator("claimant", "category", "description")
    @classmethod
    def not_empty_str(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or blank string")
        return v.strip()


class ClaimRead(BaseModel):
    id: int
    claimant: str
    date: str
    category: str
    amount: float
    currency: str
    description: str
    receipt_available: bool
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
