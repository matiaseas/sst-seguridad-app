def test_login_success(client):
    response = client.post("/api/auth/login", json={"username": "operario1", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "operario1"
    assert data["user"]["role"]["name"] == "trabajador"

def test_login_failure_wrong_password(client):
    response = client.post("/api/auth/login", json={"username": "operario1", "password": "wrongpassword"})
    assert response.status_code == 401
    assert "incorrectos" in response.json()["detail"]

def test_login_failure_unknown_user(client):
    response = client.post("/api/auth/login", json={"username": "nonexistent", "password": "password123"})
    assert response.status_code == 401

def test_get_current_user_me(client, worker_token):
    headers = {"Authorization": f"Bearer {worker_token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "operario1"
    assert data["role"]["name"] == "trabajador"
