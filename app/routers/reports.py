import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from PIL import Image

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.report import Report, ReportType, Location, Attachment
from app.models.risk import RiskAssessment
from app.models.notification import Notification, SystemSetting
from app.schemas.report import (
    ReportListItem, ReportDetailOut, ReportTypeOut, LocationOut,
    AttachmentOut, ReportStatusUpdate
)
from app.services.auth_service import get_current_user, get_current_active_user, require_roles
from app.services.audit_service import audit_service

router = APIRouter(prefix="/reports", tags=["Reportes de Seguridad"])

def generate_report_code(db: Session) -> str:
    """Genera automáticamente el siguiente código único correlativo: SST-2026-00001"""
    year = settings.CURRENT_YEAR
    prefix = f"{settings.REPORT_CODE_PREFIX}-{year}-"
    last_report = db.query(Report).filter(Report.code.like(f"{prefix}%")).order_by(desc(Report.id)).first()
    
    if last_report and last_report.code:
        try:
            last_num = int(last_report.code.split("-")[-1])
            next_num = last_num + 1
        except Exception:
            next_num = db.query(Report).count() + 1
    else:
        next_num = 1

    return f"{prefix}{next_num:05d}"

@router.get("/meta/types", response_model=List[ReportTypeOut])
def get_report_types(db: Session = Depends(get_db)):
    """Obtiene el catálogo de tipos de reporte."""
    return db.query(ReportType).all()

@router.get("/meta/locations", response_model=List[LocationOut])
def get_locations(db: Session = Depends(get_db)):
    """Obtiene el catálogo de sectores/ubicaciones activas."""
    return db.query(Location).filter(Location.is_active == True).all()

@router.post("", response_model=ReportDetailOut)
async def create_report(
    report_type_id: int = Form(...),
    location_id: int = Form(...),
    description: str = Form(...),
    urgency: str = Form("Media"),
    immediate_danger: bool = Form(False),
    is_anonymous: bool = Form(False),
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Crea un nuevo reporte de forma ágil (< 2 minutos).
    Soporta trabajadores identificados o reporte anónimo, con carga simultánea de fotos.
    """
    # Validar configuración de anonimato
    if is_anonymous:
        anon_setting = db.query(SystemSetting).filter(SystemSetting.key == "allow_anonymous").first()
        if anon_setting and anon_setting.value.lower() == "false":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Los reportes anónimos están deshabilitados.")

    # Validar claves foráneas
    report_type = db.query(ReportType).filter(ReportType.id == report_type_id).first()
    if not report_type:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo de reporte inválido.")

    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ubicación inválida.")

    # Generar código correlativo único
    code = generate_report_code(db)

    # Si es anónimo, el reporter_id se establece en None
    reporter_id = None if is_anonymous or not current_user else current_user.id

    now = datetime.now(timezone.utc)
    report = Report(
        code=code,
        report_type_id=report_type_id,
        location_id=location_id,
        reporter_id=reporter_id,
        description=description.strip(),
        urgency=urgency,
        immediate_danger=immediate_danger,
        is_anonymous=is_anonymous,
        status="Reportado",
        created_at=now,
        updated_at=now
    )
    db.add(report)
    db.flush()

    # Procesar imágenes adjuntas si se enviaron
    if files:
        for f in files:
            if not f.filename:
                continue
            valid_mimes = ["image/jpeg", "image/png", "image/webp"]
            if f.content_type not in valid_mimes:
                continue

            content = await f.read()
            if len(content) > 5 * 1024 * 1024:
                continue # Omitir si excede 5MB

            file_ext = Path(f.filename).suffix or ".jpg"
            unique_filename = f"report_{report.id}_{uuid.uuid4().hex[:8]}{file_ext}"
            dest_path = settings.UPLOAD_DIR / unique_filename

            with open(dest_path, "wb") as out_f:
                out_f.write(content)

            try:
                with Image.open(dest_path) as im:
                    if im.width > 1920 or im.height > 1080:
                        im.thumbnail((1920, 1080))
                        im.save(dest_path, quality=85)
            except Exception:
                pass

            attachment = Attachment(
                report_id=report.id,
                file_path=f"/static/uploads/{unique_filename}",
                file_name=f.filename,
                file_size=len(content),
                mime_type=f.content_type or "image/jpeg",
                is_evidence=False,
                created_at=now
            )
            db.add(attachment)

    # Notificar a los Responsables SST
    sst_users = db.query(User).join(User.role).filter(User.role.has(name="responsable_sst")).all()
    for sst_user in sst_users:
        db.add(Notification(
            user_id=sst_user.id,
            report_id=report.id,
            title="Nuevo reporte recibido",
            message=f"Nuevo reporte {report.code} ({report_type.name}) en {location.name}. Urgencia: {urgency}."
        ))

    db.commit()
    db.refresh(report)

    # Auditoría inicial
    reporter_str = "Anónimo" if is_anonymous else (current_user.full_name if current_user else "Trabajador no autenticado")
    audit_service.log(
        db=db,
        report_id=report.id,
        action_type="CREACION",
        details=f"Reporte {report.code} creado por {reporter_str}. Urgencia: {urgency}, Peligro Inmediato: {'Sí' if immediate_danger else 'No'}.",
        user=current_user if not is_anonymous else None
    )

    return ReportDetailOut.model_validate(report)

@router.get("", response_model=List[ReportListItem])
def list_reports(
    status: Optional[str] = Query(None),
    report_type_id: Optional[int] = Query(None),
    location_id: Optional[int] = Query(None),
    urgency: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    only_mine: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Listado con filtros facetados y búsqueda.
    Si el usuario es 'trabajador', ve únicamente sus reportes propios.
    """
    query = db.query(Report)

    # Control de acceso según rol
    if current_user and current_user.role.name == "trabajador":
        query = query.filter(Report.reporter_id == current_user.id)
    elif only_mine and current_user:
        query = query.filter(Report.reporter_id == current_user.id)

    if status:
        query = query.filter(Report.status == status)
    if report_type_id:
        query = query.filter(Report.report_type_id == report_type_id)
    if location_id:
        query = query.filter(Report.location_id == location_id)
    if urgency:
        query = query.filter(Report.urgency == urgency)
    if search:
        search_filter = or_(
            Report.code.ilike(f"%{search}%"),
            Report.description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    reports = query.order_by(desc(Report.id)).all()

    # Filtrar por nivel de riesgo si fue solicitado
    result = []
    for r in reports:
        risk_lvl = r.risk_assessment.risk_level if r.risk_assessment else None
        risk_sc = r.risk_assessment.risk_score if r.risk_assessment else None

        if risk_level and risk_lvl != risk_level:
            continue

        reporter_display = "Anónimo" if r.is_anonymous else (r.reporter.full_name if r.reporter else "Desconocido")
        pending_actions = sum(1 for a in r.actions if a.status in ["Pendiente", "En proceso"])

        result.append(ReportListItem(
            id=r.id,
            code=r.code,
            report_type=ReportTypeOut.model_validate(r.report_type),
            location=LocationOut.model_validate(r.location),
            description=r.description,
            urgency=r.urgency,
            immediate_danger=r.immediate_danger,
            is_anonymous=r.is_anonymous,
            status=r.status,
            created_at=r.created_at,
            updated_at=r.updated_at,
            closed_at=r.closed_at,
            reporter_name=reporter_display,
            risk_level=risk_lvl,
            risk_score=risk_sc,
            attachments_count=len(r.attachments),
            actions_count=len(r.actions),
            pending_actions_count=pending_actions
        ))

    return result

@router.get("/track/{code}", response_model=ReportDetailOut)
def track_report_public(code: str, db: Session = Depends(get_db)):
    """Permite a cualquier trabajador consultar el estado de un reporte mediante su código."""
    clean_code = code.strip().upper()
    report = db.query(Report).filter(Report.code == clean_code).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontró ningún reporte con ese código.")
    return ReportDetailOut.model_validate(report)

@router.get("/{id}", response_model=ReportDetailOut)
def get_report_detail(
    id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Obtiene la ficha técnica 360° del reporte."""
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reporte no encontrado.")

    # Restringir a trabajador si no es su propio reporte
    if current_user and current_user.role.name == "trabajador" and report.reporter_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para ver este reporte.")

    return ReportDetailOut.model_validate(report)

@router.patch("/{id}/status", response_model=ReportDetailOut)
def update_report_status(
    id: int,
    payload: ReportStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["responsable_sst", "administrador"]))
):
    """
    Modifica el estado del reporte con reglas de cierre y auditoría estricta.
    """
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reporte no encontrado.")

    valid_statuses = [
        "Reportado", "En revisión", "En análisis", "Acción asignada",
        "En proceso", "Pendiente de verificación", "Cerrado", "Descartado"
    ]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Estado inválido. Opciones: {', '.join(valid_statuses)}")

    old_status = report.status

    # Validación de regla de negocio para cierre:
    # No se puede cerrar si hay acciones en 'Pendiente' o 'En proceso' sin justificación expresa
    if payload.status == "Cerrado":
        pending_actions = [a for a in report.actions if a.status in ["Pendiente", "En proceso"]]
        if pending_actions and not payload.close_reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No es posible cerrar el reporte: existen acciones pendientes o en proceso sin justificación."
            )
        report.closed_at = datetime.now(timezone.utc)
        report.close_reason = payload.close_reason or "Cierre formal con todas las acciones verificadas."
    elif payload.status == "Descartado":
        if not payload.close_reason:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debe ingresar el motivo de descarte.")
        report.close_reason = payload.close_reason
        report.closed_at = datetime.now(timezone.utc)
    else:
        report.closed_at = None

    report.status = payload.status
    report.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(report)

    # Registrar en auditoría
    action_type = "CIERRE" if payload.status == "Cerrado" else ("DESCARTE" if payload.status == "Descartado" else "CAMBIO_ESTADO")
    audit_service.log(
        db=db,
        report_id=report.id,
        action_type=action_type,
        details=f"Estado modificado de '{old_status}' a '{payload.status}' por {current_user.full_name}. Nota: {payload.notes or payload.close_reason or 'Sin nota adicional'}.",
        user=current_user
    )

    return ReportDetailOut.model_validate(report)
