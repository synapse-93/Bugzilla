from datetime import datetime, timezone
from app.extensions import db


class Project(db.Model):
    """Project entity."""
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    key = db.Column(db.String(20), unique=True, nullable=False, index=True)
    display_key = db.Column(db.String(20), nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
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
    creator = db.relationship("User", foreign_keys=[created_by])
    members = db.relationship(
        "ProjectMember",
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    issues = db.relationship(
        "Issue",
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    labels = db.relationship(
        "Label",
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    milestones = db.relationship(
        "Milestone",
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    invitations = db.relationship(
        "Invitation",
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def to_dict(self) -> dict:
        """Serialize project to dict."""
        return {
            "id": self.id,
            "name": self.name,
            "key": self.key,
            "display_key": self.display_key or self.key.split("-")[0],
            "description": self.description,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
