import uuid
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from PIL import Image

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.report import Report, Attachment
from app.models.action import Action, ActionEvidence
from app.models.notification import Notification
from app.schemas.action import ActionCreate, ActionUpdate, ActionOut, ActionEvidenceOut
from app.services.auth_service import get_current_active_user, require_roles
from app.services.audit_service import audit_service

router = APIRouter(prefix="/actions", tags=["Gestión de Acciones"])

@router.post("", response_model=ActionOut)
def create_action(
    data: ActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["responsable_sst", "administrador"]))
):
    """Crea una acción correctiva, preventiva, de mejora o control inmediato bajo la jerarquía de controles."""
    report = db.query(Report).filter(Report.id == data.report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reporte no encontrado.")

    action = Action(
        report_id=data.report_id,
        assigned_to_id=data.assigned_to_id,
        description=data.description,
        action_type=data.action_type,
        control_hierarchy=data.control_hierarchy,
        status="Pendiente",
        due_date=data.due_date,
        observations=data.observations,
        created_at=datetime.now(timezone.utc)
    )
    db.add(action)

    # Actualizar estado del reporte a 'Acción asignada' si correspondía
    if report.status in ["Reportado", "En revisión", "En análisis"]:
        report.status = "Acción asignada"

    # Si se asignó a un usuario, enviarle una notificación interna
    if data.assigned_to_id:
        assigned_user = db.query(User).filter(User.id == data.assigned_to_id).first()
        if assigned_user:
            notif = Notification(
                user_id=assigned_user.id,
                report_id=report.id,
                title="Nueva acción asignada",
                message=f"Se te asignó la acción: '{data.description[:80]}...' para el reporte {report.code}."
            )
            db.add(notif)

    db.commit()
    db.refresh(action)

    # Auditoría
    audit_service.log(
        db=db,
        report_id=report.id,
        action_type="ACCION_CREADA",
        details=f"Acción '{data.action_type}' ({data.control_hierarchy}) creada por {current_user.full_name}: '{data.description}'.",
        user=current_user
    )

    return ActionOut.model_validate(action)

@router.patch("/{id}", response_model=ActionOut)
def update_action(
    id: int,
    data: ActionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Actualiza estado o parámetros de una acción."""
    action = db.query(Action).filter(Action.id == id).first()
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Acción no encontrada.")

    # Solo el responsable SST, admin, o el usuario asignado pueden modificar la acción
    is_privileged = current_user.role.name in ["responsable_sst", "administrador"]
    is_assignee = action.assigned_to_id == current_user.id

    if not (is_privileged or is_assignee):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos sobre esta acción.")

    report = action.report
    changes = []

    if data.status and data.status != action.status:
        old_status = action.status
        action.status = data.status
        changes.append(f"Estado de '{old_status}' a '{data.status}'")
        
        now = datetime.now(timezone.utc)
        if data.status == "Completada":
            action.completed_at = now
            if report.status == "Acción asignada":
                report.status = "Pendiente de verificación"
        elif data.status == "Verificada":
            if not is_privileged:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo un Responsable SST o Admin puede verificar acciones.")
            action.verified_at = now
        elif data.status == "En proceso":
            if report.status == "Acción asignada":
                report.status = "En proceso"

    if is_privileged:
        if data.description is not None:
            action.description = data.description
        if data.action_type is not None:
            action.action_type = data.action_type
        if data.control_hierarchy is not None:
            action.control_hierarchy = data.control_hierarchy
        if data.due_date is not None:
            action.due_date = data.due_date
        if data.assigned_to_id is not None:
            action.assigned_to_id = data.assigned_to_id

    if data.observations is not None:
        action.observations = data.observations

    db.commit()
    db.refresh(action)

    if changes:
        audit_service.log(
            db=db,
            report_id=report.id,
            action_type="ACCION_ACTUALIZADA",
            details=f"Acción #{action.id} actualizada por {current_user.full_name}: {', '.join(changes)}.",
            user=current_user
        )

    return ActionOut.model_validate(action)

@router.post("/{id}/evidence", response_model=ActionEvidenceOut)
async def upload_action_evidence(
    id: int,
    notes: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Sube fotografía de evidencia de resolución y notas de cumplimiento."""
    action = db.query(Action).filter(Action.id == id).first()
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Acción no encontrada.")

    report = action.report

    # Validar formato y tamaño de archivo
    valid_mimes = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in valid_mimes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Formato de imagen inválido. Permitidos: JPG, PNG, WEBP.")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo excede el límite máximo de 5MB.")

    # Guardar y optimizar con Pillow
    file_ext = Path(file.filename).suffix or ".jpg"
    unique_filename = f"evidence_{action.id}_{uuid.uuid4().hex[:8]}{file_ext}"
    dest_path = settings.UPLOAD_DIR / unique_filename

    with open(dest_path, "wb") as f:
        f.write(content)

    # Redimensionar si es muy grande
    try:
        with Image.open(dest_path) as im:
            if im.width > 1920 or im.height > 1080:
                im.thumbnail((1920, 1080))
                im.save(dest_path, quality=85)
    except Exception:
        pass

    # Crear Attachment
    attachment = Attachment(
        report_id=report.id,
        file_path=f"/static/uploads/{unique_filename}",
        file_name=file.filename,
        file_size=len(content),
        mime_type=file.content_type,
        is_evidence=True,
        created_at=datetime.now(timezone.utc)
    )
    db.add(attachment)
    db.flush()

    # Crear ActionEvidence
    evidence = ActionEvidence(
        action_id=action.id,
        attachment_id=attachment.id,
        notes=notes,
        created_at=datetime.now(timezone.utc)
    )
    db.add(evidence)

    # Marcar automáticamente la acción como 'Completada' si estaba en proceso o pendiente
    if action.status in ["Pendiente", "En proceso"]:
        action.status = "Completada"
        action.completed_at = datetime.now(timezone.utc)
        if report.status == "Acción asignada" or report.status == "En proceso":
            report.status = "Pendiente de verificación"

    db.commit()
    db.refresh(evidence)

    audit_service.log(
        db=db,
        report_id=report.id,
        action_type="EVIDENCIA_SUBIDA",
        details=f"Evidencia cargada para acción #{action.id} por {current_user.full_name}. Nota: '{notes[:60]}'.",
        user=current_user
    )

    return ActionEvidenceOut(
        id=evidence.id,
        action_id=evidence.action_id,
        attachment_id=evidence.attachment_id,
        notes=evidence.notes,
        created_at=evidence.created_at,
        file_path=attachment.file_path
    )
