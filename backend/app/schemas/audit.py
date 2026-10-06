from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AuditLogRead(BaseModel):
    id: int
    claim_id: Optional[int] = None
    action: str
    actor: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    reason: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
