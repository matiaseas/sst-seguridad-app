from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class RiskCalculateRequest(BaseModel):
    probability: int = Field(..., ge=1, le=5, description="1 a 5 (Muy baja a Muy alta)")
    consequence: int = Field(..., ge=1, le=5, description="1 a 5 (Leve a Muy grave)")

class RiskCalculateResponse(BaseModel):
    probability: int
    consequence: int
    risk_score: int
    risk_level: str
    action_priority: str
    color_hex: str

class RiskAssessmentCreate(BaseModel):
    probability: int = Field(..., ge=1, le=5)
    consequence: int = Field(..., ge=1, le=5)
    observations: Optional[str] = None

class RiskAssessmentOut(BaseModel):
    id: int
    report_id: int
    assessor_id: int
    probability: int
    consequence: int
    risk_score: int
    risk_level: str
    methodology: str
    observations: Optional[str]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
