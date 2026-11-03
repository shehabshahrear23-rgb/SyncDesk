from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_login_without_credentials():
    response = client.post("/api/auth/login", json={})

    assert response.status_code == 422


def test_login_with_wrong_email():
    response = client.post(
        "/api/auth/login",
        json={
            "email": "unknown@example.com",
            "password": "Wrong123"
        }
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_login_with_wrong_password():
    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@example.com",
            "password": "WrongPassword123"
        }
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"