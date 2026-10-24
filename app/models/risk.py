from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), unique=True, nullable=False)
    assessor_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    probability = Column(Integer, nullable=False) # 1 a 5
    consequence = Column(Integer, nullable=False) # 1 a 5
    risk_score = Column(Integer, nullable=False)  # R = P x C (1 a 25)
    risk_level = Column(String(20), nullable=False, index=True) # 'Bajo', 'Moderado', 'Importante', 'Alto', 'Crítico'

    methodology = Column(String(100), default="Matriz 5x5 (P x C)", nullable=False)
    observations = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    report = relationship("Report", back_populates="risk_assessment")
    assessor = relationship("User")
