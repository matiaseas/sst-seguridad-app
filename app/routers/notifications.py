from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.dashboard import NotificationOut, NotificationCount
from app.services.auth_service import get_current_active_user

router = APIRouter(prefix="/notifications", tags=["Notificaciones Internas"])

@router.get("", response_model=List[NotificationOut])
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtiene las notificaciones dirigidas al usuario autenticado."""
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(desc(Notification.id)).limit(30).all()

@router.get("/unread-count", response_model=NotificationCount)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retorna la cantidad de notificaciones no leídas."""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return NotificationCount(unread_count=count)

@router.post("/{id}/read")
def mark_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Marca una notificación como leída."""
    notif = db.query(Notification).filter(Notification.id == id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificación no encontrada.")
    notif.is_read = True
    db.commit()
    return {"status": "ok"}

@router.post("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Marca todas las notificaciones del usuario como leídas."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "ok"}
