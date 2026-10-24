from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class NotificationOut(BaseModel):
    id: int
    user_id: int
    report_id: Optional[int] = None
    title: str
    message: str
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class NotificationCount(BaseModel):
    unread_count: int

class SystemSettingOut(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class DashboardKPIs(BaseModel):
    total_reports: int
    open_reports: int
    closed_reports: int
    discarded_reports: int
    overdue_actions: int
    pending_actions: int
    unsafe_conditions: int
    unsafe_acts: int
    incidents: int
    accidents: int
    immediate_dangers: int
    avg_resolution_days: float

class DashboardChartData(BaseModel):
    by_type: Dict[str, int]
    by_location: Dict[str, int]
    by_status: Dict[str, int]
    by_risk_level: Dict[str, int]
    by_urgency: Dict[str, int]
    by_month: Dict[str, int]

class DashboardResponse(BaseModel):
    kpis: DashboardKPIs
    charts: DashboardChartData
    recent_reports: List[Any]
