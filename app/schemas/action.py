from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserOut

class ActionEvidenceOut(BaseModel):
    id: int
    action_id: int
    attachment_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    file_path: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ActionBase(BaseModel):
    description: str
    action_type: str = "Acción correctiva"
    control_hierarchy: str = "Control de ingeniería"
    due_date: Optional[datetime] = None
    observations: Optional[str] = None

class ActionCreate(ActionBase):
    report_id: int
    assigned_to_id: Optional[int] = None

class ActionUpdate(BaseModel):
    description: Optional[str] = None
    action_type: Optional[str] = None
    control_hierarchy: Optional[str] = None
    assigned_to_id: Optional[int] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    observations: Optional[str] = None

class ActionOut(ActionBase):
    id: int
    report_id: int
    assigned_to_id: Optional[int]
    assigned_to: Optional[UserOut] = None
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    verified_at: Optional[datetime]
    evidences: List[ActionEvidenceOut] = []
    model_config = ConfigDict(from_attributes=True)
