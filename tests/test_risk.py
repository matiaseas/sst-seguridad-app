import pytest
from app.services.risk_service import risk_service

def test_risk_service_calculation():
    # 1 x 1 = 1 (Bajo)
    r1 = risk_service.calculate_risk(1, 1)
    assert r1["risk_score"] == 1
    assert r1["risk_level"] == "Bajo"

    # 2 x 2 = 4 (Bajo)
    r4 = risk_service.calculate_risk(2, 2)
    assert r4["risk_score"] == 4
    assert r4["risk_level"] == "Bajo"

    # 3 x 2 = 6 (Moderado)
    r6 = risk_service.calculate_risk(3, 2)
    assert r6["risk_score"] == 6
    assert r6["risk_level"] == "Moderado"

    # 4 x 3 = 12 (Importante)
    r12 = risk_service.calculate_risk(4, 3)
    assert r12["risk_score"] == 12
    assert r12["risk_level"] == "Importante"

    # 4 x 4 = 16 (Alto)
    r16 = risk_service.calculate_risk(4, 4)
    assert r16["risk_score"] == 16
    assert r16["risk_level"] == "Alto"

    # 5 x 5 = 25 (Crítico)
    r25 = risk_service.calculate_risk(5, 5)
    assert r25["risk_score"] == 25
    assert r25["risk_level"] == "Crítico"

def test_risk_service_out_of_bounds():
    with pytest.raises(ValueError):
        risk_service.calculate_risk(0, 3)
    with pytest.raises(ValueError):
        risk_service.calculate_risk(6, 2)

def test_api_risk_calculate_endpoint(client):
    response = client.post("/api/risks/calculate", json={"probability": 4, "consequence": 3})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] == 12
    assert data["risk_level"] == "Importante"

def test_api_risk_assess_permissions(client, worker_token, sst_token):
    # Un trabajador NO puede realizar evaluación de riesgo
    headers_worker = {"Authorization": f"Bearer {worker_token}"}
    res_worker = client.post("/api/risks/assess/1", json={"probability": 3, "consequence": 3}, headers=headers_worker)
    assert res_worker.status_code == 403

    # El Responsable SST SÍ puede
    headers_sst = {"Authorization": f"Bearer {sst_token}"}
    res_sst = client.post("/api/risks/assess/1", json={"probability": 4, "consequence": 3, "observations": "Evaluación verificada"}, headers=headers_sst)
    assert res_sst.status_code == 200
    assert res_sst.json()["risk_level"] == "Importante"
