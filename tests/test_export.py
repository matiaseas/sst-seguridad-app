def test_export_pdf_stream(client, sst_token):
    headers = {"Authorization": f"Bearer {sst_token}"}
    response = client.get("/api/export/pdf/1", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000  # PDF binario válido generado
    assert response.content.startswith(b"%PDF")

def test_export_excel_stream(client, sst_token):
    headers = {"Authorization": f"Bearer {sst_token}"}
    response = client.get("/api/export/excel", headers=headers)
    assert response.status_code == 200
    assert "spreadsheetml" in response.headers["content-type"]
    assert len(response.content) > 1000

def test_export_csv_stream(client, sst_token):
    headers = {"Authorization": f"Bearer {sst_token}"}
    response = client.get("/api/export/csv", headers=headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    text = response.content.decode("utf-8")
    assert "SST-2026-00001" in text
