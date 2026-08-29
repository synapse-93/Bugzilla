import os
import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    """Send transactional email using Resend API or safe development logger fallback."""
    if not to or "@" not in to:
        logger.warning("[EMAIL SERVICE] Invalid recipient email: %s", to)
        return False

    api_key = os.environ.get("RESEND_API_KEY", "").strip()
    from_email = os.environ.get("EMAIL_FROM", "Bugzilla <notifications@bugzilla.local>").strip()

    if not api_key:
        logger.info("[EMAIL SERVICE DEV] Email to: %s | Subject: %s", to, subject)
        return True

    payload = {
        "from": from_email,
        "to": [to],
        "subject": subject,
        "html": html_body,
    }
    if text_body:
        payload["text"] = text_body

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Bugzilla-Server/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status in (200, 201):
                logger.info("[EMAIL SERVICE] Successfully dispatched email to %s", to)
                return True
            return False
    except Exception as e:
        logger.error("[EMAIL SERVICE ERROR] Failed to send email via Resend: %s", str(e))
        return False


def send_welcome_email(to: str, username: str) -> bool:
    """Send welcome email to newly registered user."""
    subject = "Welcome to Bugzilla!"
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #111114; color: #f4f4f5; border-radius: 8px;">
        <h2 style="color: #60a5fa; margin-bottom: 16px;">Welcome to Bugzilla, {username}!</h2>
        <p style="color: #a1a1aa; line-height: 1.5;">Thank you for joining Bugzilla. You can now create projects, manage issues, collaborate with team members, and track deliverables.</p>
    </div>
    """
    return send_email(to, subject, html)


def send_verification_email(to: str, username: str, verification_url: str) -> bool:
    """Send email verification link."""
    subject = "Verify your Bugzilla account"
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #111114; color: #f4f4f5; border-radius: 8px;">
        <h2 style="color: #60a5fa; margin-bottom: 16px;">Welcome to Bugzilla, {username}!</h2>
        <p style="color: #a1a1aa; line-height: 1.5;">Please confirm your email address to activate your account and start tracking issues.</p>
        <div style="margin: 28px 0;">
            <a href="{verification_url}" style="background-color: #3b82f6; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #71717a; font-size: 12px;">If you did not sign up for Bugzilla, you can safely ignore this email.</p>
    </div>
    """
    return send_email(to, subject, html)


def send_password_reset_email(to: str, username: str, reset_url: str) -> bool:
    """Send password reset link."""
    subject = "Reset your Bugzilla password"
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #111114; color: #f4f4f5; border-radius: 8px;">
        <h2 style="color: #60a5fa; margin-bottom: 16px;">Password Reset Request</h2>
        <p style="color: #a1a1aa; line-height: 1.5;">Hi {username}, we received a request to reset your password. Click the link below to set a new password:</p>
        <div style="margin: 28px 0;">
            <a href="{reset_url}" style="background-color: #3b82f6; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #71717a; font-size: 12px;">This reset link will expire in 1 hour. If you didn't request a password reset, no further action is needed.</p>
    </div>
    """
    return send_email(to, subject, html)


def send_project_invitation_email(to: str, invitee_name: str, project_name: str, inviter_name: str, role: str, accept_url: str) -> bool:
    """Send project collaboration invitation."""
    subject = f"You've been invited to join {project_name} on Bugzilla"
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #111114; color: #f4f4f5; border-radius: 8px;">
        <h2 style="color: #60a5fa; margin-bottom: 16px;">Project Invitation</h2>
        <p style="color: #a1a1aa; line-height: 1.5;">Hi {invitee_name}, <strong>{inviter_name}</strong> has invited you to join the project <strong>{project_name}</strong> as a <strong>{role}</strong>.</p>
        <div style="margin: 28px 0;">
            <a href="{accept_url}" style="background-color: #3b82f6; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View & Accept Invitation</a>
        </div>
    </div>
    """
    return send_email(to, subject, html)


def send_invitation_accepted_email(to: str, inviter_name: str, invitee_name: str, project_name: str) -> bool:
    """Send confirmation to project inviter when user accepts invitation."""
    subject = f"{invitee_name} accepted your invitation to join {project_name}"
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #111114; color: #f4f4f5; border-radius: 8px;">
        <h2 style="color: #60a5fa; margin-bottom: 16px;">Invitation Accepted</h2>
        <p style="color: #a1a1aa; line-height: 1.5;">Hi {inviter_name}, <strong>{invitee_name}</strong> has accepted your invitation and is now a member of <strong>{project_name}</strong>.</p>
    </div>
    """
    return send_email(to, subject, html)


def send_issue_assigned_email(to: str, assignee_name: str, issue_identifier: str, issue_title: str, project_name: str, issue_url: str) -> bool:
    """Send issue assignment notification."""
    subject = f"Assigned to issue {issue_identifier}: {issue_title}"
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #111114; color: #f4f4f5; border-radius: 8px;">
        <h2 style="color: #60a5fa; margin-bottom: 16px;">Issue Assigned</h2>
        <p style="color: #a1a1aa; line-height: 1.5;">Hi {assignee_name}, you have been assigned to <strong>{issue_identifier}</strong> in <strong>{project_name}</strong>.</p>
        <p style="color: #f4f4f5; font-weight: 600; margin: 16px 0;">{issue_title}</p>
        <div style="margin: 24px 0;">
            <a href="{issue_url}" style="background-color: #3b82f6; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">View Issue</a>
        </div>
    </div>
    """
    return send_email(to, subject, html)
