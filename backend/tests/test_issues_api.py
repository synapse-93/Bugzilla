from app import create_app


def test_issues_unauthorized_without_token():
    """Verify /api/projects/<id>/issues returns 401 when unauthenticated."""
    app = create_app("testing")
    client = app.test_client()

    response = client.get("/api/projects/1/issues")
    assert response.status_code == 401
    data = response.get_json()
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_create_issue_unauthorized():
    """Verify creating issue returns 401 when unauthenticated."""
    app = create_app("testing")
    client = app.test_client()

    response = client.post("/api/projects/1/issues", json={"title": "Test Issue"})
    assert response.status_code == 401
    data = response.get_json()
    assert data["error"]["code"] == "UNAUTHORIZED"
