from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.models.user import User

class AuditService:
    @staticmethod
    def log(
        db: Session,
        report_id: int,
        action_type: str,
        details: str,
        user: Optional[User] = None
    ) -> AuditLog:
        audit_entry = AuditLog(
            report_id=report_id,
            user_id=user.id if user else None,
            action_type=action_type,
            details=details,
            created_at=datetime.now(timezone.utc)
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry

audit_service = AuditService()
