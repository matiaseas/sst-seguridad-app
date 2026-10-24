from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserOut
from app.schemas.risk import RiskAssessmentOut
from app.schemas.action import ActionOut

class ReportTypeOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    color_badge: str
    icon: str
    model_config = ConfigDict(from_attributes=True)

class LocationOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class AttachmentOut(BaseModel):
    id: int
    report_id: int
    file_path: str
    file_name: str
    file_size: int
    mime_type: str
    is_evidence: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AuditLogOut(BaseModel):
    id: int
    report_id: int
    user_id: Optional[int]
    user_name: Optional[str] = None
    action_type: str
    details: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ReportCreate(BaseModel):
    report_type_id: int
    location_id: int
    description: str
    urgency: str = "Media"
    immediate_danger: bool = False
    is_anonymous: bool = False

class ReportStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    close_reason: Optional[str] = None

class ReportListItem(BaseModel):
    id: int
    code: str
    report_type: ReportTypeOut
    location: LocationOut
    description: str
    urgency: str
    immediate_danger: bool
    is_anonymous: bool
    status: str
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime]
    reporter_name: Optional[str] = None
    risk_level: Optional[str] = None
    risk_score: Optional[int] = None
    attachments_count: int = 0
    actions_count: int = 0
    pending_actions_count: int = 0
    model_config = ConfigDict(from_attributes=True)

class ReportDetailOut(BaseModel):
    id: int
    code: str
    report_type: ReportTypeOut
    location: LocationOut
    reporter: Optional[UserOut] = None
    reporter_id: Optional[int] = None
    description: str
    urgency: str
    immediate_danger: bool
    is_anonymous: bool
    status: str
    close_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime]

    attachments: List[AttachmentOut] = []
    risk_assessment: Optional[RiskAssessmentOut] = None
    actions: List[ActionOut] = []
    audit_logs: List[AuditLogOut] = []
    model_config = ConfigDict(from_attributes=True)
