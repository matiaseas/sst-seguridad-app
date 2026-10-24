import io
from fastapi.testclient import TestClient
from app.main import app as fastapi_app

def test_full_operational_lifecycle(client, worker_token, sst_token, admin_token):
    """
    Simulación completa del ciclo de vida de punta a punta:
    OBSERVAR -> REPORTAR -> REGISTRAR -> ANALIZAR -> ACTUAR -> SEGUIR -> VERIFICAR -> CERRAR -> EXPORTAR
    """
    headers_worker = {"Authorization": f"Bearer {worker_token}"}
    headers_sst = {"Authorization": f"Bearer {sst_token}"}

    # 1. TRABAJADOR REPORTA CONDICIÓN INSEGURA CON FOTO
    photo_bytes = b"fake-jpg-content-for-testing"
    files = [
        ("files", ("foto_campo.jpg", io.BytesIO(photo_bytes), "image/jpeg"))
    ]
    data = {
        "report_type_id": 1,
        "location_id": 1,
        "description": "Amoladora angular con cable mellado y sin guarda protectora en banco 2.",
        "urgency": "Alta",
        "immediate_danger": False,
        "is_anonymous": False
    }

    res_create = client.post("/api/reports", data=data, files=files, headers=headers_worker)
    assert res_create.status_code == 200
    report_data = res_create.json()
    report_id = report_data["id"]
    report_code = report_data["code"]
    assert report_data["status"] == "Reportado"
    assert len(report_data["attachments"]) == 1

    # 2. RESPONSABLE SST CONSULTA LA BANDEJA Y DETECTA EL REPORTE
    res_list = client.get("/api/reports", headers=headers_sst)
    assert res_list.status_code == 200
    codes = [r["code"] for r in res_list.json()]
    assert report_code in codes

    # 3. RESPONSABLE SST ABRE FICHA Y REALIZA EVALUACIÓN DE RIESGO
    # P=4 (Alta), C=4 (Grave) => R=16 (Alto)
    res_risk = client.post(
        f"/api/risks/assess/{report_id}",
        json={"probability": 4, "consequence": 4, "observations": "Peligro severo de electrocución o atrapamiento."},
        headers=headers_sst
    )
    assert res_risk.status_code == 200
    assert res_risk.json()["risk_score"] == 16
    assert res_risk.json()["risk_level"] == "Alto"

    # Verificar que el reporte pasó automáticamente a 'En análisis'
    res_rep = client.get(f"/api/reports/{report_id}", headers=headers_sst)
    assert res_rep.json()["status"] == "En análisis"

    # 4. RESPONSABLE SST ASIGNA ACCIÓN CORRECTIVA CON JERARQUÍA DE CONTROLES
    res_act = client.post(
        "/api/actions",
        json={
            "report_id": report_id,
            "description": "Retirar amoladora de servicio, colocar guarda reglamentaria y cambiar cable de alimentación.",
            "action_type": "Acción correctiva",
            "control_hierarchy": "Control de ingeniería"
        },
        headers=headers_sst
    )
    assert res_act.status_code == 200
    action_id = res_act.json()["id"]

    # Verificar que el reporte pasó a 'Acción asignada'
    res_rep2 = client.get(f"/api/reports/{report_id}", headers=headers_sst)
    assert res_rep2.json()["status"] == "Acción asignada"

    # 5. ASIGNADO EJECUTA Y SUBE EVIDENCIA FOTOGRÁFICA
    ev_file = ("file", ("evidencia_guarda.jpg", io.BytesIO(b"evidencia-foto-bytes"), "image/jpeg"))
    res_ev = client.post(
        f"/api/actions/{action_id}/evidence",
        data={"notes": "Se reemplazó el cable por taller eléctrico y se colocó guarda original."},
        files=[ev_file],
        headers=headers_worker
    )
    assert res_ev.status_code == 200
    assert res_ev.json()["action_id"] == action_id

    # Verificar que la acción está 'Completada' y el reporte en 'Pendiente de verificación'
    res_rep3 = client.get(f"/api/reports/{report_id}", headers=headers_sst)
    assert res_rep3.json()["status"] == "Pendiente de verificación"

    # 6. RESPONSABLE SST VERIFICA ACCIÓN
    res_ver = client.patch(
        f"/api/actions/{action_id}",
        json={"status": "Verificada"},
        headers=headers_sst
    )
    assert res_ver.status_code == 200
    assert res_ver.json()["status"] == "Verificada"

    # 7. RESPONSABLE SST CIERRA FORMALMENTE EL REPORTE
    res_close = client.patch(
        f"/api/reports/{report_id}/status",
        json={"status": "Cerrado", "close_reason": "Verificación física completada en banco de trabajo."},
        headers=headers_sst
    )
    assert res_close.status_code == 200
    assert res_close.json()["status"] == "Cerrado"
    assert res_close.json()["closed_at"] is not None

    # 8. TRAZABILIDAD Y AUDITORÍA VERIFICADAS
    res_final = client.get(f"/api/reports/{report_id}", headers=headers_sst)
    audit_types = [a["action_type"] for a in res_final.json()["audit_logs"]]
    assert "CREACION" in audit_types
    assert "EVALUACION_RIESGO_REGISTRADA" in audit_types
    assert "ACCION_CREADA" in audit_types
    assert "EVIDENCIA_SUBIDA" in audit_types
    assert "CIERRE" in audit_types

    # 9. DESCARGA DE INFORME PDF FORMAL
    res_pdf = client.get(f"/api/export/pdf/{report_id}", headers=headers_sst)
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert res_pdf.content.startswith(b"%PDF")
