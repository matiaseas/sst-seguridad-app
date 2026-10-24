def test_list_meta_types(client):
    response = client.get("/api/reports/meta/types")
    assert response.status_code == 200
    types = response.json()
    assert len(types) >= 5
    type_names = [t["name"] for t in types]
    assert "Condición insegura" in type_names
    assert "Acto inseguro" in type_names

def test_list_meta_locations(client):
    response = client.get("/api/reports/meta/locations")
    assert response.status_code == 200
    locs = response.json()
    assert len(locs) >= 10
    loc_names = [l["name"] for l in locs]
    assert "Área de soldadura" in loc_names
    assert "Área de amolado" in loc_names

def test_create_report_authenticated(client, worker_token):
    headers = {"Authorization": f"Bearer {worker_token}"}
    payload = {
        "report_type_id": 1,
        "location_id": 1,
        "description": "Fuga de gas en manguera de soldadura oxiacetilénica.",
        "urgency": "Alta",
        "immediate_danger": True,
        "is_anonymous": False
    }
    response = client.post("/api/reports", data=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["code"].startswith("SST-2026-")
    assert data["status"] == "Reportado"
    assert data["urgency"] == "Alta"
    assert data["immediate_danger"] is True
    assert data["reporter"]["username"] == "operario1"

def test_create_report_anonymous(client):
    payload = {
        "report_type_id": 2,
        "location_id": 3,
        "description": "Trabajador usando amoladora sin careta protectora.",
        "urgency": "Media",
        "immediate_danger": False,
        "is_anonymous": True
    }
    response = client.post("/api/reports", data=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["code"].startswith("SST-2026-")
    assert data["is_anonymous"] is True
    assert data["reporter"] is None

def test_track_report_public(client):
    response = client.get("/api/reports/track/SST-2026-00001")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "SST-2026-00001"
    assert "cables" in data["description"].lower()
