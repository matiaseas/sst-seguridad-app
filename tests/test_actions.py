def test_create_action_permissions(client, worker_token, sst_token):
    payload = {
        "report_id": 1,
        "description": "Colocar señalética preventiva",
        "action_type": "Acción preventiva",
        "control_hierarchy": "Control administrativo"
    }

    # Trabajador no puede crear acciones
    headers_w = {"Authorization": f"Bearer {worker_token}"}
    res_w = client.post("/api/actions", json=payload, headers=headers_w)
    assert res_w.status_code == 403

    # Responsable SST sí puede
    headers_s = {"Authorization": f"Bearer {sst_token}"}
    res_s = client.post("/api/actions", json=payload, headers=headers_s)
    assert res_s.status_code == 200
    data = res_s.json()
    assert data["description"] == "Colocar señalética preventiva"
    assert data["control_hierarchy"] == "Control administrativo"
    assert data["status"] == "Pendiente"

def test_close_report_requires_justification_if_pending(client, sst_token):
    headers = {"Authorization": f"Bearer {sst_token}"}
    
    # Intentar cerrar reporte 1 (que tiene acciones en proceso/pendientes) sin justificación
    res = client.patch("/api/reports/1/status", json={"status": "Cerrado"}, headers=headers)
    assert res.status_code == 400
    assert "existen acciones pendientes" in res.json()["detail"]

    # Con justificación sí es permitido
    res_ok = client.patch(
        "/api/reports/1/status",
        json={"status": "Cerrado", "close_reason": "Se colocó pasacables temporal y se reubicó la línea."},
        headers=headers
    )
    assert res_ok.status_code == 200
    assert res_ok.json()["status"] == "Cerrado"
