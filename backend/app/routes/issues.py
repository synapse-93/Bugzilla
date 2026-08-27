from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func, desc, asc
from app.extensions import db
from app.models.project import Project
from app.models.issue import Issue
from app.models.label import Label, IssueLabel
from app.models.activity import Activity
from app.utils.auth import get_current_user, require_project_access, get_project_member_role
from app.utils.errors import api_error

issues_bp = Blueprint("issues", __name__)

VALID_TYPES = {"BUG", "FEATURE", "TASK", "IMPROVEMENT"}
VALID_STATUSES = {"OPEN", "IN_PROGRESS", "IN_REVIEW", "RESOLVED", "CLOSED"}
VALID_PRIORITIES = {"URGENT", "HIGH", "MEDIUM", "LOW"}
VALID_SEVERITIES = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
VALID_RESOLUTIONS = {"FIXED", "DUPLICATE", "WONT_FIX", "INVALID", "WORKS_FOR_ME"}


@issues_bp.route("/projects/<int:project_id>/issues", methods=["GET"])
@jwt_required()
@require_project_access()
def list_issues(project_id: int):
    """List issues for a project with optional filtering, search, and sorting."""
    query = Issue.query.filter_by(project_id=project_id)

    # Search filter on title/description
    search = request.args.get("q")
    if search:
        term = f"%{search.strip()}%"
        query = query.filter((Issue.title.ilike(term)) | (Issue.description.ilike(term)))

    # Exact filters
    status = request.args.get("status")
    if status and status in VALID_STATUSES:
        query = query.filter(Issue.status == status)

    issue_type = request.args.get("type") or request.args.get("issue_type")
    if issue_type and issue_type in VALID_TYPES:
        query = query.filter(Issue.issue_type == issue_type)

    priority = request.args.get("priority")
    if priority and priority in VALID_PRIORITIES:
        query = query.filter(Issue.priority == priority)

    severity = request.args.get("severity")
    if severity and severity in VALID_SEVERITIES:
        query = query.filter(Issue.severity == severity)

    assignee_id = request.args.get("assignee_id")
    if assignee_id:
        if assignee_id == "unassigned":
            query = query.filter(Issue.assignee_id.is_(None))
        else:
            try:
                query = query.filter(Issue.assignee_id == int(assignee_id))
            except ValueError:
                pass

    label_id = request.args.get("label_id")
    if label_id:
        try:
            query = query.join(Issue.issue_labels).filter(IssueLabel.label_id == int(label_id))
        except ValueError:
            pass

    # Sorting
    sort_by = request.args.get("sort", "created_at")
    order = request.args.get("order", "desc")
    sort_col = getattr(Issue, sort_by, Issue.created_at)
    query = query.order_by(desc(sort_col) if order.lower() == "desc" else asc(sort_col))

    issues = query.all()
    return jsonify({"issues": [i.to_dict() for i in issues]}), 200


@issues_bp.route("/projects/<int:project_id>/issues", methods=["POST"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN", "MAINTAINER", "DEVELOPER"])
def create_issue(project_id: int):
    """Create a new issue with safe sequence calculation and activity logging."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    project = Project.query.get(project_id)
    if not project:
        return api_error("NOT_FOUND", "Project not found", 404)

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = data.get("description")
    issue_type = (data.get("issue_type") or data.get("type") or "BUG").upper()
    priority = (data.get("priority") or "MEDIUM").upper()
    severity = (data.get("severity") or "MEDIUM").upper()
    assignee_id = data.get("assignee_id")
    label_ids = data.get("label_ids") or []

    details = {}
    if not title or len(title) < 2 or len(title) > 255:
        details["title"] = "Title must be between 2 and 255 characters"
    if issue_type not in VALID_TYPES:
        details["issue_type"] = f"Must be one of: {', '.join(sorted(VALID_TYPES))}"
    if priority not in VALID_PRIORITIES:
        details["priority"] = f"Must be one of: {', '.join(sorted(VALID_PRIORITIES))}"
    if severity not in VALID_SEVERITIES:
        details["severity"] = f"Must be one of: {', '.join(sorted(VALID_SEVERITIES))}"

    if details:
        return api_error("VALIDATION_ERROR", "Invalid issue data", 400, details)

    # Safe issue numbering under transaction lock
    max_num = db.session.query(func.coalesce(func.max(Issue.issue_number), 0)).filter(
        Issue.project_id == project_id
    ).with_for_update().scalar()
    next_number = max_num + 1

    issue = Issue(
        project_id=project_id,
        issue_number=next_number,
        title=title,
        description=description,
        issue_type=issue_type,
        status="OPEN",
        priority=priority,
        severity=severity,
        creator_id=user.id,
        assignee_id=assignee_id if assignee_id else None,
    )
    db.session.add(issue)
    db.session.flush()

    # Add labels
    if label_ids:
        valid_labels = Label.query.filter(
            Label.project_id == project_id, Label.id.in_(label_ids)
        ).all()
        for lbl in valid_labels:
            il = IssueLabel(issue_id=issue.id, label_id=lbl.id)
            db.session.add(il)

    # Create initial Activity record
    activity = Activity(
        issue_id=issue.id,
        actor_id=user.id,
        action_type="CREATED",
        new_value="OPEN",
    )
    activity.set_metadata({"title": title, "type": issue_type, "priority": priority})
    db.session.add(activity)

    db.session.commit()
    return jsonify({"issue": issue.to_dict()}), 201


@issues_bp.route("/projects/<int:project_id>/issues/<int:issue_id>", methods=["GET"])
@jwt_required()
@require_project_access()
def get_issue(project_id: int, issue_id: int):
    """Retrieve full issue details."""
    issue = Issue.query.filter_by(id=issue_id, project_id=project_id).first()
    if not issue:
        return api_error("NOT_FOUND", "Issue not found in this project", 404)

    return jsonify({"issue": issue.to_dict()}), 200


@issues_bp.route("/projects/<int:project_id>/issues/<int:issue_id>", methods=["PATCH"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN", "MAINTAINER", "DEVELOPER"])
def update_issue(project_id: int, issue_id: int):
    """Update issue fields and record structured activity."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    issue = Issue.query.filter_by(id=issue_id, project_id=project_id).first()
    if not issue:
        return api_error("NOT_FOUND", "Issue not found", 404)

    data = request.get_json(silent=True) or {}

    # Title
    if "title" in data:
        new_title = data["title"].strip()
        if not new_title or len(new_title) < 2 or len(new_title) > 255:
            return api_error("VALIDATION_ERROR", "Title must be between 2 and 255 characters", 400)
        if new_title != issue.title:
            act = Activity(issue_id=issue.id, actor_id=user.id, action_type="TITLE_CHANGED", old_value=issue.title, new_value=new_title)
            db.session.add(act)
            issue.title = new_title

    # Description
    if "description" in data:
        issue.description = data["description"]

    # Status
    if "status" in data:
        new_status = data["status"].upper()
        if new_status not in VALID_STATUSES:
            return api_error("VALIDATION_ERROR", f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}", 400)
        if new_status != issue.status:
            act = Activity(issue_id=issue.id, actor_id=user.id, action_type="STATUS_CHANGED", old_value=issue.status, new_value=new_status)
            db.session.add(act)
            issue.status = new_status
            if new_status in {"RESOLVED", "CLOSED"}:
                issue.resolved_at = datetime.now(timezone.utc)
            else:
                issue.resolved_at = None

    # Priority
    if "priority" in data:
        new_priority = data["priority"].upper()
        if new_priority not in VALID_PRIORITIES:
            return api_error("VALIDATION_ERROR", f"Invalid priority. Must be one of: {', '.join(sorted(VALID_PRIORITIES))}", 400)
        if new_priority != issue.priority:
            act = Activity(issue_id=issue.id, actor_id=user.id, action_type="PRIORITY_CHANGED", old_value=issue.priority, new_value=new_priority)
            db.session.add(act)
            issue.priority = new_priority

    # Severity
    if "severity" in data:
        new_severity = data["severity"].upper()
        if new_severity not in VALID_SEVERITIES:
            return api_error("VALIDATION_ERROR", f"Invalid severity. Must be one of: {', '.join(sorted(VALID_SEVERITIES))}", 400)
        if new_severity != issue.severity:
            act = Activity(issue_id=issue.id, actor_id=user.id, action_type="SEVERITY_CHANGED", old_value=issue.severity, new_value=new_severity)
            db.session.add(act)
            issue.severity = new_severity

    # Resolution
    if "resolution" in data:
        new_res = (data["resolution"] or "").upper() if data["resolution"] else None
        if new_res and new_res not in VALID_RESOLUTIONS:
            return api_error("VALIDATION_ERROR", f"Invalid resolution. Must be one of: {', '.join(sorted(VALID_RESOLUTIONS))}", 400)
        if new_res != issue.resolution:
            act = Activity(issue_id=issue.id, actor_id=user.id, action_type="RESOLUTION_SET", old_value=issue.resolution, new_value=new_res)
            db.session.add(act)
            issue.resolution = new_res

    # Assignee
    if "assignee_id" in data:
        new_assignee_id = data["assignee_id"]
        if new_assignee_id != issue.assignee_id:
            old_str = str(issue.assignee_id) if issue.assignee_id else "Unassigned"
            new_str = str(new_assignee_id) if new_assignee_id else "Unassigned"
            act = Activity(issue_id=issue.id, actor_id=user.id, action_type="ASSIGNED", old_value=old_str, new_value=new_str)
            db.session.add(act)
            issue.assignee_id = new_assignee_id

    # Labels update
    if "label_ids" in data:
        new_label_ids = set(data["label_ids"])
        current_label_ids = {il.label_id for il in issue.issue_labels}
        if new_label_ids != current_label_ids:
            # Delete removed
            for il in list(issue.issue_labels):
                if il.label_id not in new_label_ids:
                    db.session.delete(il)
            # Add new
            for lid in new_label_ids:
                if lid not in current_label_ids:
                    db.session.add(IssueLabel(issue_id=issue.id, label_id=lid))

    db.session.commit()
    return jsonify({"issue": issue.to_dict()}), 200


@issues_bp.route("/projects/<int:project_id>/issues/<int:issue_id>", methods=["DELETE"])
@jwt_required()
def delete_issue(project_id: int, issue_id: int):
    """Delete an issue (ADMIN/MAINTAINER or issue creator)."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    issue = Issue.query.filter_by(id=issue_id, project_id=project_id).first()
    if not issue:
        return api_error("NOT_FOUND", "Issue not found", 404)

    role = get_project_member_role(project_id, user.id)
    if not role:
        return api_error("FORBIDDEN", "Not a project member", 403)

    if role not in {"ADMIN", "MAINTAINER"} and issue.creator_id != user.id:
        return api_error("FORBIDDEN", "Only admins, maintainers, or creator can delete this issue", 403)

    db.session.delete(issue)
    db.session.commit()
    return jsonify({"status": "deleted", "issue_id": issue_id}), 200
