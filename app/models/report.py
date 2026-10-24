from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class ReportType(Base):
    __tablename__ = "report_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False) # 'Condición insegura', 'Acto inseguro', 'Incidente', 'Accidente', 'Observación preventiva', 'Otro'
    description = Column(String(255), nullable=True)
    color_badge = Column(String(20), default="blue") # 'yellow', 'amber', 'red', 'purple', 'teal', 'gray'
    icon = Column(String(50), default="alert-triangle")

    reports = relationship("Report", back_populates="report_type")

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False) # 'Área de soldadura', 'Área de corte', etc.
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    reports = relationship("Report", back_populates="location")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True) # Ej: 'SST-2026-00001'
    report_type_id = Column(Integer, ForeignKey("report_types.id", ondelete="RESTRICT"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="RESTRICT"), nullable=False)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    description = Column(Text, nullable=False)
    urgency = Column(String(20), default="Media", nullable=False) # 'Baja', 'Media', 'Alta', 'Crítica'
    immediate_danger = Column(Boolean, default=False, nullable=False)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    
    # 8 Estados oficiales
    status = Column(String(30), default="Reportado", nullable=False, index=True)
    # 'Reportado', 'En revisión', 'En análisis', 'Acción asignada', 'En proceso', 'Pendiente de verificación', 'Cerrado', 'Descartado'
    
    close_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    closed_at = Column(DateTime, nullable=True)

    # Relaciones
    report_type = relationship("ReportType", back_populates="reports")
    location = relationship("Location", back_populates="reports")
    reporter = relationship("User", back_populates="reports_submitted", foreign_keys=[reporter_id])
    attachments = relationship("Attachment", back_populates="report", cascade="all, delete-orphan")
    risk_assessment = relationship("RiskAssessment", back_populates="report", uselist=False, cascade="all, delete-orphan")
    actions = relationship("Action", back_populates="report", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="report", cascade="all, delete-orphan")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(50), nullable=False)
    is_evidence = Column(Boolean, default=False, nullable=False) # True si es evidencia de cierre de acción
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    report = relationship("Report", back_populates="attachments")
