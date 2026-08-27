from app import create_app


def test_projects_unauthorized_without_token():
    """Verify /api/projects returns 401 when unauthenticated."""
    app = create_app("testing")
    client = app.test_client()

    response = client.get("/api/projects")
    assert response.status_code == 401
    data = response.get_json()
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_projects_post_unauthorized():
    """Verify creating project requires authentication."""
    app = create_app("testing")
    client = app.test_client()

    response = client.post("/api/projects", json={"name": "Test Project", "key": "TEST"})
    assert response.status_code == 401
    data = response.get_json()
    assert data["error"]["code"] == "UNAUTHORIZED"
