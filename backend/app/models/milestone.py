from datetime import datetime, timezone
from app.extensions import db


class Milestone(db.Model):
    """Project milestone entity."""
    __tablename__ = "milestones"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.DateTime(timezone=True), nullable=True)
    status = db.Column(db.String(20), default="OPEN", nullable=False)  # OPEN, COMPLETED
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

    # Relationships
    project = db.relationship("Project", back_populates="milestones")
    issues = db.relationship("Issue", back_populates="milestone")

    def to_dict(self) -> dict:
        """Serialize milestone to dict."""
        total = len(self.issues)
        closed = len([i for i in self.issues if i.status in ("RESOLVED", "CLOSED")])
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "status": self.status,
            "total_issues": total,
            "closed_issues": closed,
            "progress": round((closed / total) * 100) if total > 0 else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
