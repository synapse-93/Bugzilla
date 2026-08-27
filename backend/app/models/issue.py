from datetime import datetime, timezone
from app.extensions import db


class Issue(db.Model):
    """Issue entity."""
    __tablename__ = "issues"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    issue_number = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    issue_type = db.Column(
        db.String(20),
        nullable=False,
        default="BUG",
    )  # BUG, FEATURE, TASK, IMPROVEMENT
    status = db.Column(
        db.String(20),
        nullable=False,
        default="OPEN",
    )  # OPEN, IN_PROGRESS, IN_REVIEW, RESOLVED, CLOSED
    priority = db.Column(
        db.String(20),
        nullable=False,
        default="MEDIUM",
    )  # URGENT, HIGH, MEDIUM, LOW
    severity = db.Column(
        db.String(20),
        nullable=False,
        default="MEDIUM",
    )  # CRITICAL, HIGH, MEDIUM, LOW
    creator_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    assignee_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    resolution = db.Column(
        db.String(20),
        nullable=True,
    )  # FIXED, DUPLICATE, WONT_FIX, INVALID, WORKS_FOR_ME
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    resolved_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
    )

    __table_args__ = (
        db.UniqueConstraint("project_id", "issue_number", name="uq_project_issue_number"),
        db.Index("ix_issues_project_status", "project_id", "status"),
    )

    # Relationships
    project = db.relationship("Project", back_populates="issues")
    creator = db.relationship("User", foreign_keys=[creator_id], back_populates="created_issues")
    assignee = db.relationship("User", foreign_keys=[assignee_id], back_populates="assigned_issues")
    issue_labels = db.relationship(
        "IssueLabel",
        back_populates="issue",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    comments = db.relationship(
        "Comment",
        back_populates="issue",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Comment.created_at.asc()",
    )
    activities = db.relationship(
        "Activity",
        back_populates="issue",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Activity.created_at.asc()",
    )

    @property
    def identifier(self) -> str:
        """Formatted human-readable identifier (e.g. BUG-142)."""
        key = self.project.key if self.project else "ISSUE"
        return f"{key}-{self.issue_number}"

    def to_dict(self) -> dict:
        """Serialize issue to dict."""
        return {
            "id": self.id,
            "project_id": self.project_id,
            "issue_number": self.issue_number,
            "identifier": self.identifier,
            "title": self.title,
            "description": self.description,
            "issue_type": self.issue_type,
            "status": self.status,
            "priority": self.priority,
            "severity": self.severity,
            "creator_id": self.creator_id,
            "assignee_id": self.assignee_id,
            "resolution": self.resolution,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "creator": self.creator.to_dict(include_email=False) if self.creator else None,
            "assignee": self.assignee.to_dict(include_email=False) if self.assignee else None,
            "labels": [il.label.to_dict() for il in self.issue_labels if il.label],
        }
