from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.report import Report
from app.models.risk import RiskAssessment
from app.schemas.risk import RiskCalculateRequest, RiskCalculateResponse, RiskAssessmentCreate, RiskAssessmentOut
from app.services.auth_service import require_roles
from app.services.risk_service import risk_service
from app.services.audit_service import audit_service

router = APIRouter(prefix="/risks", tags=["Evaluación de Riesgos"])

@router.post("/calculate", response_model=RiskCalculateResponse)
def calculate_risk_preview(data: RiskCalculateRequest):
    """Calcula y previsualiza la criticidad y nivel de riesgo sin persistir."""
    try:
        res = risk_service.calculate_risk(data.probability, data.consequence)
        return RiskCalculateResponse(
            probability=res["probability"],
            consequence=res["consequence"],
            risk_score=res["risk_score"],
            risk_level=res["risk_level"],
            action_priority=res["action_priority"],
            color_hex=res["color_hex"]
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/assess/{report_id}", response_model=RiskAssessmentOut)
def save_risk_assessment(
    report_id: int,
    data: RiskAssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["responsable_sst", "administrador"]))
):
    """Guarda o actualiza la evaluación de riesgo oficial de un reporte (Solo SST y Admin)."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reporte no encontrado.")

    calc = risk_service.calculate_risk(data.probability, data.consequence)

    assessment = db.query(RiskAssessment).filter(RiskAssessment.report_id == report_id).first()
    if assessment:
        assessment.probability = data.probability
        assessment.consequence = data.consequence
        assessment.risk_score = calc["risk_score"]
        assessment.risk_level = calc["risk_level"]
        assessment.observations = data.observations
        assessment.assessor_id = current_user.id
        action_name = "EVALUACION_RIESGO_ACTUALIZADA"
    else:
        assessment = RiskAssessment(
            report_id=report_id,
            assessor_id=current_user.id,
            probability=data.probability,
            consequence=data.consequence,
            risk_score=calc["risk_score"],
            risk_level=calc["risk_level"],
            methodology="Matriz 5x5 (P x C)",
            observations=data.observations
        )
        db.add(assessment)
        action_name = "EVALUACION_RIESGO_REGISTRADA"

    # Si el reporte estaba en 'Reportado' o 'En revisión', pasa automáticamente a 'En análisis'
    if report.status in ["Reportado", "En revisión"]:
        report.status = "En análisis"

    db.commit()
    db.refresh(assessment)

    # Registrar en auditoría
    audit_service.log(
        db=db,
        report_id=report.id,
        action_type=action_name,
        details=f"Evaluación de riesgo: P={data.probability} x C={data.consequence} = {calc['risk_score']} ({calc['risk_level']}). Asignado por {current_user.full_name}.",
        user=current_user
    )

    return RiskAssessmentOut.model_validate(assessment)
