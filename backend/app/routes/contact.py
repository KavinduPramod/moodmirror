"""
Contact Route
Handles contact form submissions via Resend email API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import httpx
from app.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


@router.post("/contact")
async def send_contact_message(request: ContactRequest):
    """
    Accept a contact form submission and send it via Resend
    """
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured — contact form disabled")
        raise HTTPException(
            status_code=503,
            detail="Contact form is currently unavailable. Please try again later."
        )

    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #334155;">
        <h2 style="color: #8b5cf6;">📬 New MoodMirror Contact Message</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #64748b;">Name</td>
            <td style="padding: 8px;">{request.name}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding: 8px; font-weight: bold; color: #64748b;">Email</td>
            <td style="padding: 8px;">{request.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #64748b;">Subject</td>
            <td style="padding: 8px;">{request.subject}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding: 8px; font-weight: bold; color: #64748b; vertical-align: top;">Message</td>
            <td style="padding: 8px; white-space: pre-wrap;">{request.message}</td>
          </tr>
        </table>
        <p style="color:#94a3b8; font-size:12px; margin-top:24px;">
          Sent via MoodMirror Contact Form
        </p>
      </body>
    </html>
    """

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": "MoodMirror Contact <noreply@info.moodmirror.online>",
                    "to": ["contact@moodmirror.online"],
                    "reply_to": request.email,
                    "subject": f"[MoodMirror Contact] {request.subject} — from {request.name}",
                    "html": html,
                },
                timeout=10,
            )

        if response.status_code not in (200, 201):
            logger.error(f"Resend API error: {response.status_code} — {response.text}")
            raise HTTPException(
                status_code=502,
                detail="Failed to send message. Please try again shortly."
            )

        logger.info(f"Contact form submitted by {request.email} — Subject: {request.subject}")
        return {"message": "Your message has been sent successfully."}

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timed out. Please try again.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Contact form error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
