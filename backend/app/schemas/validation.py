from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ValidationResultRead(BaseModel):
    id: int
    claim_id: int
    check_type: str
    status: str # PASS, FAIL, WARNING
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
