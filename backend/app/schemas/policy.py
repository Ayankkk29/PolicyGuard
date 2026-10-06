from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class PolicySectionCreate(BaseModel):
    section_number: str = Field(..., description="e.g. 3.2")
    title: str = Field(..., description="Section title")
    content: str = Field(..., description="Full section text")
    category: Optional[str] = Field(default=None, description="Matching category if applicable")
    tags: Optional[str] = Field(default=None, description="Search keywords or tags")


class PolicySectionRead(BaseModel):
    id: int
    policy_id: int
    section_number: str
    title: str
    content: str
    category: Optional[str] = None
    tags: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PolicyCreate(BaseModel):
    name: str = Field(..., description="Policy Name")
    version: str = Field(..., description="Policy Version e.g. 2.1")
    description: Optional[str] = Field(default=None)
    effective_date: str = Field(..., description="YYYY-MM-DD")
    sections: List[PolicySectionCreate] = Field(default_factory=list)


class PolicyRead(BaseModel):
    id: int
    name: str
    version: str
    description: Optional[str] = None
    effective_date: str
    is_active: bool
    created_at: datetime
    sections: List[PolicySectionRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class PolicyTextImport(BaseModel):
    name: str
    version: str
    description: Optional[str] = None
    effective_date: str
    raw_text: str
