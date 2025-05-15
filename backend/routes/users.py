# backend/routes/user.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import logging
from fastapi.security import OAuth2PasswordBearer
import base64
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

from backend.database import get_user_from_db, update_user_profile, _sanity_client, get_posts_by_user
from backend.utils.security import verify_access_token
from backend.config import get_settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter(tags=["Users"])  # 
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None
    profile_picture: Optional[str] = None
    
class EmailVerificationRequest(BaseModel):
    email: EmailStr
    
class VerifyEmailCodeRequest(BaseModel):
    code: str

@router.get("/profile")
async def get_profile(token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    logging.debug(f"Fetching profile for user_id: {user_id}")
    user = get_user_from_db(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/profile")
async def update_profile(
    update_data: UpdateProfileRequest,
    token: str = Depends(oauth2_scheme)
):
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    updates = update_data.dict(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    success = update_user_profile(user_id, updates)
    if not success:
        raise HTTPException(status_code=500, detail="Error updating profile")
    return {"message": "Profile updated successfully"}

# ─── NEW ───
@router.get("/{user_id}/posts")
async def get_user_posts(
    user_id: str,
    token: dict = Depends(verify_access_token)
):
    # ensure they can only fetch their own posts (or drop this check if you want public profiles)
    if token.get("sub") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return get_posts_by_user(user_id)

# ---------------------------------------------------------------------
# Upload avatar endpoint
# ---------------------------------------------------------------------

# ---------------------------------------------------------------------
# Email verification endpoints
# ---------------------------------------------------------------------

@router.post("/profile/send-verification-email", status_code=status.HTTP_200_OK)
async def send_verification_email(token: str = Depends(oauth2_scheme)):
    """Send an email verification code to the user's email with detailed logging."""
    logger.info("[/profile/send-verification-email] Request received")

    try:
        payload = verify_access_token(token)
        user_id = payload.get("sub")

        if not user_id:
            logger.warning("[/profile/send-verification-email] Missing user_id in token")
            raise HTTPException(status_code=401, detail="Invalid token")

        user = get_user_from_db(user_id)
        if not user:
            logger.warning(f"[/profile/send-verification-email] User not found: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        recipient_email = user.get("email")
        if not recipient_email:
            logger.warning(f"[/profile/send-verification-email] User {user_id} has no email")
            raise HTTPException(status_code=400, detail="User has no email on file")

        # Generate a 6-digit random code (numbers only for ease of entry)
        verification_code = "".join(str(uuid.uuid4().int)[:6])
        expires_at = datetime.utcnow() + timedelta(minutes=15)

        logger.debug(f"[/profile/send-verification-email] Code {verification_code} expires at {expires_at}")

        # Persist code to DB
        verification_data = {
            "email_verification_code": verification_code,
            "email_verification_expiry": str(expires_at),
        }

        try:
            if not update_user_profile(user_id, verification_data):
                raise RuntimeError("DynamoDB update returned False")
        except Exception as e:
            logger.exception("[/profile/send-verification-email] Failed to store code")
            raise HTTPException(status_code=500, detail=f"DB error storing verification code: {e}")

        settings = get_settings()
        logger.debug(
            f"[/profile/send-verification-email] SMTP server={settings.smtp_server}:{settings.smtp_port} TLS={settings.smtp_use_tls} user={settings.smtp_username}"
        )

        if not settings.smtp_username or not settings.smtp_password:
            raise HTTPException(status_code=500, detail="SMTP credentials not configured on server")

        # Construct email message
        msg = MIMEMultipart()
        msg["Subject"] = "Verify Your Email - Lost Gates"
        msg["From"] = settings.email_sender
        msg["To"] = recipient_email

        html_content = f"""
        <html>
            <body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\">
                <div style=\"max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;\">
                    <h2 style=\"color: #B388EB;\">Lost Gates Email Verification</h2>
                    <p>Hello {user.get('display_name') or user.get('username')},</p>
                    <p>Please use the verification code below:</p>
                    <div style=\"background-color: #f7f7f7; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;\">
                        <h2 style=\"margin: 0; letter-spacing: 3px; color: #333;\">{verification_code}</h2>
                    </div>
                    <p>This code expires in 15 minutes.</p>
                </div>
            </body>
        </html>"""

        msg.attach(MIMEText(html_content, "html"))

        # Send via SMTP
        try:
            with smtplib.SMTP(settings.smtp_server, settings.smtp_port, timeout=10) as server:
                if settings.smtp_use_tls:
                    server.starttls()
                server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(msg)
            logger.info(f"[/profile/send-verification-email] Verification email sent to {recipient_email}")
            return {"message": "Verification email sent successfully"}
        except Exception as e:
            logger.exception("[/profile/send-verification-email] SMTP send failed")
            raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")

    except HTTPException:
        # Already logged / has meaningful detail
        raise
    except Exception as e:
        logger.exception("[/profile/send-verification-email] Unhandled exception")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/verify-email-code", status_code=status.HTTP_200_OK)
async def verify_email_code(
    request: VerifyEmailCodeRequest,
    token: str = Depends(oauth2_scheme)
):
    """Verify the email verification code."""
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = get_user_from_db(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if there's a valid verification code
    stored_code = user.get("email_verification_code")
    expiry_str = user.get("email_verification_expiry")
    
    if not stored_code or not expiry_str:
        raise HTTPException(status_code=400, detail="No verification code found")
    
    # Check if code has expired
    try:
        expiry = datetime.fromisoformat(expiry_str)
        if datetime.utcnow() > expiry:
            raise HTTPException(status_code=400, detail="Verification code has expired")
    except ValueError:
        raise HTTPException(status_code=500, detail="Invalid expiry date format")
    
    # Verify the code
    if request.code != stored_code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Mark email as verified and clear verification data
    verification_data = {
        "is_email_verified": True,
        "email_verification_code": None,
        "email_verification_expiry": None
    }
    
    success = update_user_profile(user_id, verification_data)
    if not success:
        raise HTTPException(status_code=500, detail="Error updating verification status")
    
    return {"message": "Email verified successfully"}

@router.post("/profile/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    token: str = Depends(oauth2_scheme)
):
    """Accepts an image upload, stores it via Sanity (if configured) or as base64 fallback,
    then updates the user's profile_picture field and returns the stored reference/URL."""

    payload = verify_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        if _sanity_client:
            # Upload raw bytes to Sanity and store the returned image reference dict
            image_ref = _sanity_client.upload_image_bytes(content, file.content_type)
            stored_val = image_ref  # can be stored as-is; front-end will send back the dict
        else:
            # Basic fallback – embed as data URL (not ideal for production)
            b64 = base64.b64encode(content).decode()
            stored_val = f"data:{file.content_type};base64,{b64}"

        if not update_user_profile(user_id, {"profile_picture": stored_val}):
            raise HTTPException(status_code=500, detail="Failed to update profile picture")

        return {"profile_picture": stored_val}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))