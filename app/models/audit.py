from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    action_type = Column(String(50), nullable=False)
    # 'CREACION', 'CAMBIO_ESTADO', 'EVALUACION_RIESGO', 'ACCION_CREADA', 'ACCION_ACTUALIZADA', 'EVIDENCIA_SUBIDA', 'CIERRE', 'DESCARTE', 'MODIFICACION'
    
    details = Column(Text, nullable=False) # Descripción textual del cambio o payload JSON
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    report = relationship("Report", back_populates="audit_logs")
    user = relationship("User")
