from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func, desc, asc
from app.extensions import db
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
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

# Allowed status transitions
ALLOWED_STATUS_TRANSITIONS = {
    "OPEN": {"OPEN", "IN_PROGRESS"},
    "IN_PROGRESS": {"IN_PROGRESS", "IN_REVIEW", "OPEN"},
    "IN_REVIEW": {"IN_REVIEW", "RESOLVED", "IN_PROGRESS"},
    "RESOLVED": {"RESOLVED", "CLOSED", "OPEN", "IN_PROGRESS"},
    "CLOSED": {"CLOSED", "OPEN"},
}

# Explicit public sorting fields allowlist
ALLOWED_SORT_FIELDS = {
    "created_at": Issue.created_at,
    "updated_at": Issue.updated_at,
    "issue_number": Issue.issue_number,
    "priority": Issue.priority,
    "severity": Issue.severity,
    "status": Issue.status,
    "title": Issue.title,
}


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

    # Exact filters with strict validation
    if "status" in request.args:
        status_val = (request.args.get("status") or "").upper()
        if status_val not in VALID_STATUSES:
            return api_error(
                "VALIDATION_ERROR",
                f"Invalid status filter '{status_val}'. Must be one of: {', '.join(sorted(VALID_STATUSES))}",
                400,
                {"status": "Invalid status filter"},
            )
        query = query.filter(Issue.status == status_val)

    if "type" in request.args or "issue_type" in request.args:
        type_val = (request.args.get("type") or request.args.get("issue_type") or "").upper()
        if type_val not in VALID_TYPES:
            return api_error(
                "VALIDATION_ERROR",
                f"Invalid type filter '{type_val}'. Must be one of: {', '.join(sorted(VALID_TYPES))}",
                400,
                {"type": "Invalid type filter"},
            )
        query = query.filter(Issue.issue_type == type_val)

    if "priority" in request.args:
        priority_val = (request.args.get("priority") or "").upper()
        if priority_val not in VALID_PRIORITIES:
            return api_error(
                "VALIDATION_ERROR",
                f"Invalid priority filter '{priority_val}'. Must be one of: {', '.join(sorted(VALID_PRIORITIES))}",
                400,
                {"priority": "Invalid priority filter"},
            )
        query = query.filter(Issue.priority == priority_val)

    if "severity" in request.args:
        severity_val = (request.args.get("severity") or "").upper()
        if severity_val not in VALID_SEVERITIES:
            return api_error(
                "VALIDATION_ERROR",
                f"Invalid severity filter '{severity_val}'. Must be one of: {', '.join(sorted(VALID_SEVERITIES))}",
                400,
                {"severity": "Invalid severity filter"},
            )
        query = query.filter(Issue.severity == severity_val)

    if "assignee_id" in request.args:
        raw_assignee = (request.args.get("assignee_id") or "").strip()
        if raw_assignee.lower() == "unassigned":
            query = query.filter(Issue.assignee_id.is_(None))
        else:
            try:
                aid = int(raw_assignee)
                query = query.filter(Issue.assignee_id == aid)
            except ValueError:
                return api_error(
                    "VALIDATION_ERROR",
                    "Invalid assignee_id filter. Must be an integer or 'unassigned'",
                    400,
                    {"assignee_id": "Must be an integer or 'unassigned'"},
                )

    if "label_id" in request.args:
        raw_label = (request.args.get("label_id") or "").strip()
        try:
            lid = int(raw_label)
            query = query.join(Issue.issue_labels).filter(IssueLabel.label_id == lid)
        except ValueError:
            return api_error(
                "VALIDATION_ERROR",
                "Invalid label_id filter. Must be an integer",
                400,
                {"label_id": "Must be an integer"},
            )

    # Sorting
    sort_by = request.args.get("sort", "created_at")
    if sort_by not in ALLOWED_SORT_FIELDS:
        return api_error(
            "VALIDATION_ERROR",
            f"Invalid sort field '{sort_by}'. Allowed fields: {', '.join(sorted(ALLOWED_SORT_FIELDS.keys()))}",
            400,
            {"sort": "Invalid sort field"},
        )
    sort_col = ALLOWED_SORT_FIELDS[sort_by]

    order = request.args.get("order", "desc").lower()
    if order not in {"asc", "desc"}:
        return api_error(
            "VALIDATION_ERROR",
            f"Invalid order parameter '{order}'. Must be 'asc' or 'desc'",
            400,
            {"order": "Must be 'asc' or 'desc'"},
        )

    query = query.order_by(desc(sort_col) if order == "desc" else asc(sort_col))

    issues = query.all()
    return jsonify({"issues": [i.to_dict() for i in issues]}), 200


@issues_bp.route("/projects/<int:project_id>/issues", methods=["POST"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN", "MAINTAINER", "DEVELOPER"])
def create_issue(project_id: int):
    """Create a new issue with safe sequence calculation, assignee & label boundary validation."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    project = db.session.query(Project).filter_by(id=project_id).with_for_update().first()
    if not project:
        return api_error("NOT_FOUND", "Project not found", 404)

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = data.get("description")
    issue_type = (data.get("issue_type") or data.get("type") or "BUG").upper()
    priority = (data.get("priority") or "MEDIUM").upper()
    severity = (data.get("severity") or "MEDIUM").upper()
    assignee_id = data.get("assignee_id")
    label_ids = data.get("label_ids")

    details = {}
    if not title or len(title) < 2 or len(title) > 255:
        details["title"] = "Title must be between 2 and 255 characters"
    if issue_type not in VALID_TYPES:
        details["issue_type"] = f"Must be one of: {', '.join(sorted(VALID_TYPES))}"
    if priority not in VALID_PRIORITIES:
        details["priority"] = f"Must be one of: {', '.join(sorted(VALID_PRIORITIES))}"
    if severity not in VALID_SEVERITIES:
        details["severity"] = f"Must be one of: {', '.join(sorted(VALID_SEVERITIES))}"

    # Assignee project-membership validation
    target_assignee_id = None
    if assignee_id is not None and assignee_id != "":
        try:
            target_assignee_id = int(assignee_id)
        except (ValueError, TypeError):
            details["assignee_id"] = "Assignee ID must be a valid integer"

        if target_assignee_id is not None:
            assignee_user = db.session.get(User, target_assignee_id)
            if not assignee_user:
                return api_error("NOT_FOUND", "Assignee user not found", 404, {"assignee_id": "User does not exist"})
            membership = ProjectMember.query.filter_by(
                project_id=project_id, user_id=target_assignee_id
            ).first()
            if not membership:
                details["assignee_id"] = "Assignee must be a member of this project"

    # Label project-boundary validation
    validated_label_ids = []
    if label_ids is not None:
        if not isinstance(label_ids, list):
            details["label_ids"] = "Label IDs must be a list"
        else:
            try:
                unique_lids = list({int(lid) for lid in label_ids})
            except (ValueError, TypeError):
                details["label_ids"] = "All label IDs must be valid integers"
                unique_lids = []

            if unique_lids:
                found_labels = Label.query.filter(
                    Label.project_id == project_id, Label.id.in_(unique_lids)
                ).all()
                if len(found_labels) != len(unique_lids):
                    details["label_ids"] = "One or more labels do not exist or belong to another project"
                else:
                    validated_label_ids = [lbl.id for lbl in found_labels]

    if details:
        return api_error("VALIDATION_ERROR", "Invalid issue data", 400, details)

    # Safe issue numbering under project row lock
    max_num = db.session.query(func.coalesce(func.max(Issue.issue_number), 0)).filter(
        Issue.project_id == project_id
    ).scalar()
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
        assignee_id=target_assignee_id,
        resolution=None,
        resolved_at=None,
    )
    db.session.add(issue)
    db.session.flush()

    # Add labels atomically
    for lid in validated_label_ids:
        il = IssueLabel(issue_id=issue.id, label_id=lid)
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
    """Update issue fields with workflow, boundary, and consistency enforcement."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    issue = Issue.query.filter_by(id=issue_id, project_id=project_id).first()
    if not issue:
        return api_error("NOT_FOUND", "Issue not found", 404)

    data = request.get_json(silent=True) or {}

    # Title
    if "title" in data:
        new_title = (data["title"] or "").strip()
        if not new_title or len(new_title) < 2 or len(new_title) > 255:
            return api_error("VALIDATION_ERROR", "Title must be between 2 and 255 characters", 400, {"title": "Length between 2 and 255"})
        if new_title != issue.title:
            act = Activity(issue_id=issue.id, actor_id=user.id, action_type="TITLE_CHANGED", old_value=issue.title, new_value=new_title)
            db.session.add(act)
            issue.title = new_title

    # Description
    if "description" in data:
        issue.description = data["description"]

    # Issue Type
    if "issue_type" in data or "type" in data:
        new_type = (data.get("issue_type") or data.get("type") or "").upper()
        if new_type not in VALID_TYPES:
            return api_error("VALIDATION_ERROR", f"Invalid issue type. Must be one of: {', '.join(sorted(VALID_TYPES))}", 400, {"issue_type": "Invalid type"})
        if new_type != issue.issue_type:
            act = Activity(issue_id=issue.id, actor_id=user.id, action_type="TYPE_CHANGED", old_value=issue.issue_type, new_value=new_type)
            db.session.add(act)
            issue.issue_type = new_type

    # Priority
    if "priority" in data:
        new_priority = (data["priority"] or "").upper()
        if new_priority not in VALID_PRIORITIES:
            return api_error("VALIDATION_ERROR", f"Invalid priority. Must be one of: {', '.join(sorted(VALID_PRIORITIES))}", 400, {"priority": "Invalid priority"})
        if new_priority != issue.priority:
            act = Activity(issue_id=issue.id, actor_id=user.id, action_type="PRIORITY_CHANGED", old_value=issue.priority, new_value=new_priority)
            db.session.add(act)
            issue.priority = new_priority

    # Severity
    if "severity" in data:
        new_severity = (data["severity"] or "").upper()
        if new_severity not in VALID_SEVERITIES:
            return api_error("VALIDATION_ERROR", f"Invalid severity. Must be one of: {', '.join(sorted(VALID_SEVERITIES))}", 400, {"severity": "Invalid severity"})
        if new_severity != issue.severity:
            act = Activity(issue_id=issue.id, actor_id=user.id, action_type="SEVERITY_CHANGED", old_value=issue.severity, new_value=new_severity)
            db.session.add(act)
            issue.severity = new_severity

    # Status transition & Resolution consistency
    target_status = issue.status
    if "status" in data:
        new_status = (data["status"] or "").upper()
        if new_status not in VALID_STATUSES:
            return api_error("VALIDATION_ERROR", f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}", 400, {"status": "Invalid status"})
        
        # Check transition map
        allowed_next = ALLOWED_STATUS_TRANSITIONS.get(issue.status, set())
        if new_status not in allowed_next:
            return api_error(
                "VALIDATION_ERROR",
                f"Illegal status transition from {issue.status} to {new_status}. Allowed transitions: {', '.join(sorted(allowed_next))}",
                400,
                {"status": f"Cannot transition from {issue.status} to {new_status}"}
            )
        target_status = new_status

    # Resolution handling
    if "resolution" in data:
        raw_res = data["resolution"]
        if raw_res is not None and raw_res != "":
            new_res = str(raw_res).upper()
            if new_res not in VALID_RESOLUTIONS:
                return api_error("VALIDATION_ERROR", f"Invalid resolution. Must be one of: {', '.join(sorted(VALID_RESOLUTIONS))}", 400, {"resolution": "Invalid resolution"})
            
            # Prevent setting resolution on open/in-progress/in-review
            if target_status in {"OPEN", "IN_PROGRESS", "IN_REVIEW"}:
                return api_error(
                    "VALIDATION_ERROR",
                    f"Resolution '{new_res}' cannot be set on an issue with status '{target_status}'",
                    400,
                    {"resolution": "Resolution is only allowed for RESOLVED or CLOSED status"}
                )
            if new_res != issue.resolution:
                act = Activity(issue_id=issue.id, actor_id=user.id, action_type="RESOLUTION_SET", old_value=issue.resolution, new_value=new_res)
                db.session.add(act)
                issue.resolution = new_res
        else:
            # clearing resolution
            if target_status not in {"RESOLVED", "CLOSED"}:
                issue.resolution = None

    # Apply status change if requested
    if "status" in data and target_status != issue.status:
        act = Activity(issue_id=issue.id, actor_id=user.id, action_type="STATUS_CHANGED", old_value=issue.status, new_value=target_status)
        db.session.add(act)
        issue.status = target_status

        if target_status in {"RESOLVED", "CLOSED"}:
            if not issue.resolved_at:
                issue.resolved_at = datetime.now(timezone.utc)
            if not issue.resolution:
                issue.resolution = "FIXED"
        else:
            # Reopened to OPEN, IN_PROGRESS, or IN_REVIEW
            issue.resolved_at = None
            issue.resolution = None

    # Assignee project-membership validation
    if "assignee_id" in data:
        raw_aid = data["assignee_id"]
        if raw_aid is None or raw_aid == "":
            target_aid = None
        else:
            try:
                target_aid = int(raw_aid)
            except (ValueError, TypeError):
                return api_error("VALIDATION_ERROR", "Assignee ID must be a valid integer", 400, {"assignee_id": "Invalid integer"})
            
            assignee_user = db.session.get(User, target_aid)
            if not assignee_user:
                return api_error("NOT_FOUND", "Assignee user not found", 404, {"assignee_id": "User does not exist"})
            membership = ProjectMember.query.filter_by(project_id=project_id, user_id=target_aid).first()
            if not membership:
                return api_error("VALIDATION_ERROR", "Assignee must be a member of this project", 400, {"assignee_id": "User is not a project member"})

        if target_aid != issue.assignee_id:
            old_str = str(issue.assignee_id) if issue.assignee_id else "Unassigned"
            new_str = str(target_aid) if target_aid else "Unassigned"
            act = Activity(issue_id=issue.id, actor_id=user.id, action_type="ASSIGNED", old_value=old_str, new_value=new_str)
            db.session.add(act)
            issue.assignee_id = target_aid

    # Label project-boundary validation & atomic update
    if "label_ids" in data:
        raw_lids = data["label_ids"]
        if not isinstance(raw_lids, list):
            return api_error("VALIDATION_ERROR", "label_ids must be a list", 400, {"label_ids": "Must be a list"})
        
        try:
            target_label_ids = list({int(lid) for lid in raw_lids})
        except (ValueError, TypeError):
            return api_error("VALIDATION_ERROR", "All label IDs must be valid integers", 400, {"label_ids": "Invalid integer in list"})

        if target_label_ids:
            found_labels = Label.query.filter(
                Label.project_id == project_id, Label.id.in_(target_label_ids)
            ).all()
            if len(found_labels) != len(target_label_ids):
                return api_error(
                    "VALIDATION_ERROR",
                    "One or more labels do not exist or belong to another project",
                    400,
                    {"label_ids": "All labels must exist and belong to the project"}
                )
            valid_set = {lbl.id for lbl in found_labels}
        else:
            valid_set = set()

        current_label_ids = {il.label_id for il in issue.issue_labels}
        if valid_set != current_label_ids:
            # Delete removed
            for il in list(issue.issue_labels):
                if il.label_id not in valid_set:
                    db.session.delete(il)
            # Add new
            for lid in valid_set:
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

