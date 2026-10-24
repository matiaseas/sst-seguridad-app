from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.report import Report
from app.models.user import User
from app.services.auth_service import get_current_user, require_roles
from app.services.export_service import export_service

router = APIRouter(prefix="/export", tags=["Exportación e Informes"])

@router.get("/pdf/{report_id}")
def export_report_pdf(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Genera y descarga el informe técnico en PDF formal del reporte."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reporte no encontrado.")

    pdf_buffer = export_service.generate_report_pdf(report)
    filename = f"Informe_{report.code}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )

@router.get("/excel")
def export_reports_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["responsable_sst", "administrador"]))
):
    """Exporta el dataset completo de reportes a un archivo Excel (.xlsx) estilizado."""
    reports = db.query(Report).order_by(desc(Report.id)).all()
    excel_buffer = export_service.generate_excel_export(reports)
    filename = f"Reportes_SST_{reports[0].code if reports else 'export'}.xlsx"

    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/csv")
def export_reports_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["responsable_sst", "administrador"]))
):
    """Exporta el dataset de reportes a archivo CSV estándar."""
    reports = db.query(Report).order_by(desc(Report.id)).all()
    csv_buffer = export_service.generate_csv_export(reports)
    filename = "Reportes_SST_Dataset.csv"

    return StreamingResponse(
        iter([csv_buffer.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
