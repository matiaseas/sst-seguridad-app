from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.report import Report, ReportType, Location
from app.models.risk import RiskAssessment
from app.models.action import Action
from app.schemas.dashboard import DashboardResponse, DashboardKPIs, DashboardChartData
from app.services.auth_service import require_roles

router = APIRouter(prefix="/dashboard", tags=["Dashboard y Analítica SST"])

@router.get("/stats", response_model=DashboardResponse)
def get_dashboard_stats(
    period: str = Query("all", description="Periodo: 7d, 30d, 90d, year, all"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["responsable_sst", "administrador"]))
):
    """Calcula KPIs agregados y datos para gráficos con filtros temporales dinámicos."""
    now = datetime.now(timezone.utc)
    query = db.query(Report)

    if period == "7d":
        query = query.filter(Report.created_at >= now - timedelta(days=7))
    elif period == "30d":
        query = query.filter(Report.created_at >= now - timedelta(days=30))
    elif period == "90d":
        query = query.filter(Report.created_at >= now - timedelta(days=90))
    elif period == "year":
        query = query.filter(Report.created_at >= datetime(now.year, 1, 1, tzinfo=timezone.utc))

    reports = query.all()
    report_ids = [r.id for r in reports]

    # KPIs
    total = len(reports)
    closed = sum(1 for r in reports if r.status == "Cerrado")
    discarded = sum(1 for r in reports if r.status == "Descartado")
    open_rep = total - closed - discarded
    immediate = sum(1 for r in reports if r.immediate_danger)

    # Conteo por tipos
    conditions = sum(1 for r in reports if r.report_type.name == "Condición insegura")
    acts = sum(1 for r in reports if r.report_type.name == "Acto inseguro")
    incidents = sum(1 for r in reports if r.report_type.name == "Incidente")
    accidents = sum(1 for r in reports if r.report_type.name == "Accidente")

    # Acciones
    actions = db.query(Action).filter(Action.report_id.in_(report_ids)).all() if report_ids else []
    pending_actions = sum(1 for a in actions if a.status in ["Pendiente", "En proceso"])
    overdue_actions = sum(
        1 for a in actions
        if a.due_date and a.due_date.replace(tzinfo=timezone.utc) < now and a.status in ["Pendiente", "En proceso"]
    )

    # Tiempo promedio de resolución (días) para reportes cerrados
    closed_reports_list = [r for r in reports if r.status == "Cerrado" and r.closed_at]
    if closed_reports_list:
        total_days = sum((r.closed_at.replace(tzinfo=timezone.utc) - r.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 86400 for r in closed_reports_list)
        avg_days = round(total_days / len(closed_reports_list), 1)
    else:
        avg_days = 0.0

    kpis = DashboardKPIs(
        total_reports=total,
        open_reports=open_rep,
        closed_reports=closed,
        discarded_reports=discarded,
        overdue_actions=overdue_actions,
        pending_actions=pending_actions,
        unsafe_conditions=conditions,
        unsafe_acts=acts,
        incidents=incidents,
        accidents=accidents,
        immediate_dangers=immediate,
        avg_resolution_days=avg_days
    )

    # Gráficos
    by_type = {}
    for r in reports:
        t_name = r.report_type.name
        by_type[t_name] = by_type.get(t_name, 0) + 1

    by_location = {}
    for r in reports:
        l_name = r.location.name
        by_location[l_name] = by_location.get(l_name, 0) + 1

    by_status = {}
    for r in reports:
        s_name = r.status
        by_status[s_name] = by_status.get(s_name, 0) + 1

    by_risk = {"Bajo": 0, "Moderado": 0, "Importante": 0, "Alto": 0, "Crítico": 0, "Sin evaluar": 0}
    for r in reports:
        if r.risk_assessment:
            lvl = r.risk_assessment.risk_level
            by_risk[lvl] = by_risk.get(lvl, 0) + 1
        else:
            by_risk["Sin evaluar"] += 1

    by_urgency = {"Baja": 0, "Media": 0, "Alta": 0, "Crítica": 0}
    for r in reports:
        by_urgency[r.urgency] = by_urgency.get(r.urgency, 0) + 1

    # Agrupación por mes (últimos meses)
    by_month = {}
    for r in reports:
        m_label = r.created_at.strftime("%Y-%m")
        by_month[m_label] = by_month.get(m_label, 0) + 1

    charts = DashboardChartData(
        by_type=by_type,
        by_location=by_location,
        by_status=by_status,
        by_risk_level=by_risk,
        by_urgency=by_urgency,
        by_month=dict(sorted(by_month.items()))
    )

    recent_summary = [
        {
            "id": r.id,
            "code": r.code,
            "type": r.report_type.name,
            "location": r.location.name,
            "status": r.status,
            "urgency": r.urgency,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M"),
            "risk_level": r.risk_assessment.risk_level if r.risk_assessment else "Sin evaluar"
        }
        for r in sorted(reports, key=lambda x: x.id, reverse=True)[:5]
    ]

    return DashboardResponse(
        kpis=kpis,
        charts=charts,
        recent_reports=recent_summary
    )
