import logging

from django.conf import settings

from emails.utils import send_custom_email

logger = logging.getLogger(__name__)

SUPPORT_EMAIL = getattr(settings, "SUPPORT_EMAIL", "support@myregistra.net")
FRONTEND_URL = getattr(settings, "FRONTEND_URL", "https://myregistra.net")


def send_feedback_emails(feedback):
    """
    Sends two emails when feedback is submitted (synchronous, no Celery):
      1. A thank-you acknowledgment to the submitter.
      2. A notification to the platform support team.
    """
    # Determine submitter's name and email
    if feedback.user:
        submitter_name = feedback.user.get_full_name() or feedback.user.username
        submitter_email = feedback.user.email
    else:
        submitter_name = feedback.guest_name or "Guest"
        submitter_email = feedback.guest_email

    stars = "★" * feedback.rating
    rating_label = {1: "Terrible", 2: "Poor", 3: "Okay", 4: "Good", 5: "Excellent"}.get(
        feedback.rating, "Unknown"
    )

    # ──────────────────────────────────────────────
    # 1. Thank-you email to the submitter
    # ──────────────────────────────────────────────
    if submitter_email:
        thank_you_html = f"""
        <h2 style="color: #1a3a5c; margin: 0 0 20px 0;">Thank you for your feedback!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0 0 15px 0;">
            Hi <strong>{submitter_name}</strong>,
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0 0 15px 0;">
            We really appreciate you taking the time to share your experience.
        </p>
        <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #1e40af;">
                <strong>Your rating:</strong> {stars} ({rating_label})
            </p>
            {f'<p style="margin: 0; font-size: 14px; color: #1e40af;"><strong>Comment:</strong> {feedback.comment}</p>' if feedback.comment else ""}
        </div>
        <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0 0 15px 0;">
            Your input helps us make EduSphere better for everyone. 
            If you have any further suggestions, don't hesitate to reach out.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0;">
            Best regards,<br>
            <strong>The EduSphere Team</strong>
        </p>
        """

        send_custom_email(
            recipient_email=submitter_email,
            subject=f"Thank you for your feedback, {submitter_name}! 🎉",
            body_html=thank_you_html,
            use_wrapper=True,
        )
        logger.info(f"Feedback acknowledgment sent to {submitter_email}")

    # ──────────────────────────────────────────────
    # 2. Notification email to the support team
    # ──────────────────────────────────────────────
    school_name = feedback.school.name if feedback.school else "N/A"
    page_link = f"{FRONTEND_URL}{feedback.page_url}" if feedback.page_url else "N/A"

    notify_html = f"""
    <h2 style="color: #1a3a5c; margin: 0 0 20px 0;">📬 New Feedback Received</h2>
    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 0 0 24px 0;">
        <table style="width: 100%; font-size: 14px; color: #334155; border-collapse: collapse;">
            <tr>
                <td style="padding: 6px 12px 6px 0; font-weight: 600; color: #1e293b; width: 100px;"><strong>Rating</strong></td>
                <td style="padding: 6px 0;">{stars} ({rating_label})</td>
            </tr>
            <tr>
                <td style="padding: 6px 12px 6px 0; font-weight: 600; color: #1e293b;"><strong>Submitter</strong></td>
                <td style="padding: 6px 0;">{submitter_name} &lt;{submitter_email}&gt;</td>
            </tr>
            <tr>
                <td style="padding: 6px 12px 6px 0; font-weight: 600; color: #1e293b;"><strong>School</strong></td>
                <td style="padding: 6px 0;">{school_name}</td>
            </tr>
            <tr>
                <td style="padding: 6px 12px 6px 0; font-weight: 600; color: #1e293b;"><strong>Page</strong></td>
                <td style="padding: 6px 0;"><a href="{page_link}" style="color: #2563eb;">{feedback.page_url or "N/A"}</a></td>
            </tr>
            <tr>
                <td style="padding: 6px 12px 6px 0; font-weight: 600; color: #1e293b;"><strong>Date</strong></td>
                <td style="padding: 6px 0;">{feedback.created_at.strftime("%b %d, %Y at %H:%M")}</td>
            </tr>
        </table>
        {f'<div style="margin-top: 16px; padding: 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;"><p style="margin: 0 0 6px 0; font-weight: 600; color: #1e293b; font-size: 13px;">COMMENT</p><p style="margin: 0; color: #334155; font-size: 14px;">{feedback.comment}</p></div>' if feedback.comment else ""}
    </div>
    <p style="font-size: 13px; color: #64748b;">
        View all feedback in the <a href="{FRONTEND_URL}/dashboard/super-admin/feedback" style="color: #2563eb;">admin dashboard</a>.
    </p>
    """

    send_custom_email(
        recipient_email=SUPPORT_EMAIL,
        subject=f"New feedback — {feedback.rating}★ from {submitter_name}",
        body_html=notify_html,
        use_wrapper=True,
    )
    logger.info(f"Feedback notification sent to support ({SUPPORT_EMAIL})")
