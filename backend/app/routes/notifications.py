from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.notification import Notification
from app.utils.auth import get_current_user
from app.utils.errors import api_error

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/notifications", methods=["GET"])
@jwt_required()
def list_notifications():
    """List recent notifications for the logged-in user."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    notifications = Notification.query.filter_by(
        user_id=user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()

    unread_count = Notification.query.filter_by(
        user_id=user.id, is_read=False
    ).count()

    return jsonify({
        "notifications": [n.to_dict() for n in notifications],
        "unread_count": unread_count,
    }), 200


@notifications_bp.route("/notifications/<int:notification_id>/read", methods=["PATCH"])
@jwt_required()
def mark_notification_read(notification_id: int):
    """Mark a single notification as read."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    notif = Notification.query.filter_by(id=notification_id, user_id=user.id).first()
    if not notif:
        return api_error("NOT_FOUND", "Notification not found", 404)

    notif.is_read = True
    db.session.commit()
    return jsonify({"notification": notif.to_dict()}), 200


@notifications_bp.route("/notifications/mark-all-read", methods=["POST"])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read for current user."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    Notification.query.filter_by(user_id=user.id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"status": "success"}), 200
