from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Action(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    description = Column(Text, nullable=False)
    action_type = Column(String(50), default="Acción correctiva", nullable=False)
    # 'Acción correctiva', 'Acción preventiva', 'Mejora', 'Control inmediato'

    control_hierarchy = Column(String(50), default="Control de ingeniería", nullable=False)
    # 'Eliminación', 'Sustitución', 'Control de ingeniería', 'Control administrativo', 'Equipo de protección personal'

    status = Column(String(30), default="Pendiente", nullable=False, index=True)
    # 'Pendiente', 'En proceso', 'Completada', 'Verificada', 'Vencida'

    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    observations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    report = relationship("Report", back_populates="actions")
    assigned_to = relationship("User", back_populates="actions_assigned", foreign_keys=[assigned_to_id])
    evidences = relationship("ActionEvidence", back_populates="action", cascade="all, delete-orphan")

class ActionEvidence(Base):
    __tablename__ = "action_evidences"

    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, ForeignKey("actions.id", ondelete="CASCADE"), nullable=False)
    attachment_id = Column(Integer, ForeignKey("attachments.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    action = relationship("Action", back_populates="evidences")
    attachment = relationship("Attachment")
