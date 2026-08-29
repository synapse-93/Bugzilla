import concurrent.futures
import os
import uuid
import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.config import TestingConfig, normalize_database_url
from app.extensions import db
from app.models.user import User
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.issue import Issue


@pytest.mark.skipif(
    not os.environ.get("TEST_DATABASE_URL"),
    reason="TEST_DATABASE_URL not configured; skipping live PostgreSQL concurrency test",
)
def test_issue_number_concurrency_postgresql():
    """Verify concurrent issue creation against real PostgreSQL generates unique, gapless issue numbers.
    
    This integration test requires a live PostgreSQL instance pointed to by TEST_DATABASE_URL.
    It executes concurrent HTTP POST requests to create issues within the same project,
    verifying that the project-level transaction locking mechanism prevents duplicate
    issue numbers and sequence gaps.
    """
    test_db_url = normalize_database_url(os.environ.get("TEST_DATABASE_URL"))
    
    class PostgresLiveTestingConfig(TestingConfig):
        SQLALCHEMY_DATABASE_URI = test_db_url

    app = create_app(PostgresLiveTestingConfig)

    # 1. Setup tables & test user + project
    unique_suffix = uuid.uuid4().hex[:8]
    username = f"concur_user_{unique_suffix}"
    email = f"concur_{unique_suffix}@example.com"
    project_key = f"CN{unique_suffix[:4].upper()}"

    with app.app_context():
        db.drop_all()
        db.create_all()

        user = User(username=username, email=email)
        user.set_password("Password123!")
        db.session.add(user)
        db.session.commit()

        project = Project(
            name=f"Concurrency Test Project {unique_suffix}",
            key=project_key,
            created_by=user.id,
        )
        db.session.add(project)
        db.session.commit()

        member = ProjectMember(
            project_id=project.id,
            user_id=user.id,
            role="ADMIN",
        )
        db.session.add(member)
        db.session.commit()

        user_id = user.id
        project_id = project.id
        token = create_access_token(identity=str(user_id))

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    url = f"/api/projects/{project_id}/issues"

    num_concurrent_creations = 15

    def worker_create_issue(index: int):
        """Worker thread executing issue creation via Flask test client."""
        client = app.test_client()
        response = client.post(
            url,
            headers=headers,
            json={
                "title": f"Concurrent Issue {index}",
                "description": f"Created in concurrent thread {index}",
                "priority": "HIGH",
                "severity": "MEDIUM",
                "issue_type": "BUG",
            },
        )
        return index, response.status_code, response.get_json()

    # 2. Execute concurrent requests using ThreadPoolExecutor
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = [
            executor.submit(worker_create_issue, i)
            for i in range(1, num_concurrent_creations + 1)
        ]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    try:
        # 3. Assert all requests succeeded with 201 Created
        failed_requests = [r for r in results if r[1] != 201]
        assert not failed_requests, f"Some concurrent creations failed: {failed_requests}"

        # 4. Extract generated issue numbers
        issue_numbers = []
        for idx, status, body in results:
            assert "issue" in body, f"Invalid response body: {body}"
            issue_data = body["issue"]
            assert issue_data["project_id"] == project_id
            issue_numbers.append(issue_data["issue_number"])

        # 5. Verify uniqueness and sequential assignment
        assert len(issue_numbers) == num_concurrent_creations
        assert len(set(issue_numbers)) == num_concurrent_creations, (
            f"Duplicate issue numbers generated under concurrency: {issue_numbers}"
        )
        sorted_numbers = sorted(issue_numbers)
        expected_numbers = list(range(1, num_concurrent_creations + 1))
        assert sorted_numbers == expected_numbers, (
            f"Issue numbers mismatch. Got {sorted_numbers}, expected {expected_numbers}"
        )

    finally:
        # 6. Clean up test data
        with app.app_context():
            Issue.query.filter_by(project_id=project_id).delete()
            ProjectMember.query.filter_by(project_id=project_id).delete()
            Project.query.filter_by(id=project_id).delete()
            User.query.filter_by(id=user_id).delete()
            db.session.commit()
