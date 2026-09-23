from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "online"


def test_get_employees():
    res = client.get("/api/employees")
    assert res.status_code == 200
    assert isinstance(res.json(), list)