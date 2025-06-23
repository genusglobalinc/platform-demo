# backend/routes/user.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Request, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import logging
import os
import requests
from fastapi.security import OAuth2PasswordBearer
import base64
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

from backend.database import (
    get_user_from_db,
    update_user_profile,
    _sanity_client,
    get_posts_by_user,
    get_user_by_email,
    get_user_by_username,
)
from backend.utils.security import verify_access_token
from backend.config import get_settings
from backend.services.background_tasks import sync_steam_profiles
from backend.services.steam_utils import fetch_steam_profile

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter(tags=["Users"])  # 
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

STEAM_API_KEY = os.getenv("STEAM_API_KEY")

class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None
    profile_picture: Optional[str] = None
    demographic_info: Optional[Dict[str, Any]] = None  # nested demographic data
    steam_id: Optional[str] = None  # 64-bit SteamID or vanity URL
    email: Optional[EmailStr] = None

class EmailVerificationRequest(BaseModel):
    email: EmailStr
    
class VerifyEmailCodeRequest(BaseModel):
    code: str

def fetch_steam_profile(steam_input: str) -> Optional[Dict[str, Any]]:
    """Return complete Steam profile info with debugging"""
    try:
        if not STEAM_API_KEY:
            logger.warning("STEAM_API_KEY not configured; skipping Steam lookup")
            return None

        logger.info(f"Starting Steam profile lookup for: {steam_input}")
        
        # Resolve vanity URL to steamid64 if needed
        steamid = steam_input
        if not steam_input.isdigit():
            logger.debug(f"Resolving vanity URL: {steam_input}")
            vanity_resp = requests.get(
                "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/",
                params={"key": STEAM_API_KEY, "vanityurl": steam_input},
                timeout=10
            ).json()
            logger.debug(f"Vanity URL response: {vanity_resp}")
            
            if vanity_resp.get("response", {}).get("success") != 1:
                logger.warning(f"Vanity URL resolution failed for: {steam_input}")
                return None
                
            steamid = vanity_resp["response"]["steamid"]
            logger.info(f"Resolved vanity URL {steam_input} to SteamID: {steamid}")

        # Get full player summary
        logger.debug(f"Fetching player summary for SteamID: {steamid}")
        summ_resp = requests.get(
            "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/",
            params={"key": STEAM_API_KEY, "steamids": steamid},
            timeout=10
        ).json()
        logger.debug(f"Player summary response: {summ_resp}")
        
        players = summ_resp.get("response", {}).get("players", [])
        if not players:
            logger.warning(f"No player data found for SteamID: {steamid}")
            return None
            
        p = players[0]
        logger.info(f"Successfully fetched Steam profile for: {p.get('personaname')}")
        
        # Return comprehensive profile data
        return {
            "steam_id": steamid,
            "persona_name": p.get("personaname"),
            "avatar": p.get("avatarfull"),
            "profile_url": p.get("profileurl"),
            "time_created": p.get("timecreated"),
            "last_logoff": p.get("lastlogoff"),
            "visibility": p.get("communityvisibilitystate"),
            "profile_state": p.get("profilestate"),
            "real_name": p.get("realname"),
            "primary_clan_id": p.get("primaryclanid"),
            "game_extra_info": p.get("gameextrainfo"),
            "game_id": p.get("gameid"),
            "loc_country_code": p.get("loccountrycode"),
            "loc_state_code": p.get("locstatecode"),
            "loc_city_id": p.get("loccityid"),
            "debug": {
                "vanity_input": steam_input,
                "api_response": summ_resp
            }
        }
    except Exception as e:
        logger.error(f"Steam API lookup failed: {e}", exc_info=True)
        return None

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
    # Decode token to get user_id
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    # Fetch user to verify existence
    user = get_user_from_db(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updates = update_data.dict(exclude_unset=True)  # Only include set fields
    
    # Handle optional Steam profile fetching
    if updates.get("steam_id"):
        try:
            # Get profile data using the utility function
            steam_input = updates["steam_id"].strip()
            logger.debug(f"Attempting to fetch Steam profile for input: {steam_input}")
            
            # First check if the Steam API key is configured
            if not STEAM_API_KEY:
                raise HTTPException(
                    status_code=500,
                    detail="Steam API is not configured on the server"
                )
            
            steam_profile = fetch_steam_profile(steam_input)
            
            # Verify the profile was found before proceeding
            if not steam_profile:
                logger.warning(f"Could not find Steam profile for: {steam_input}")
                raise HTTPException(
                    status_code=400, 
                    detail="Could not validate Steam profile. Please check your Steam ID or URL."
                )
                
            logger.info(f"Successfully fetched Steam profile: {steam_profile.get('persona_name')}")
            
            # Add fetched profile to updates
            updates["steam_profile"] = steam_profile
            updates["last_steam_sync"] = str(datetime.utcnow())
            
            # Don't need to store the raw ID separately
            del updates["steam_id"]
        except HTTPException:
            # Re-raise HTTP exceptions without modification
            raise
        except Exception as e:
            logger.error(f"Steam profile error: {e}", exc_info=True)
            raise HTTPException(
                status_code=400, 
                detail="Could not validate Steam profile. Please check your Steam ID or URL."
            )
            
    # Handle email change
    if "email" in updates:
        new_email = updates["email"].lower()
        current_user = get_user_from_db(user_id)
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")

        if new_email != current_user.get("email", "").lower():
            # Email uniqueness check
            if get_user_by_email(new_email):
                raise HTTPException(status_code=400, detail="Email already in use")

            # Reset verification status and codes
            updates["is_email_verified"] = False
            updates["email_verification_code"] = None
            updates["email_verification_expiry"] = None

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    success = update_user_profile(user_id, updates)
    if not success:
        raise HTTPException(status_code=500, detail="Error updating profile")

    # Sync to Sanity (best-effort)
    if _sanity_client:
        try:
            _sanity_client.patch_document(user_id, updates)
        except Exception as e:
            logger.warning(f"Failed to patch Sanity user doc: {e}")

    return {"message": "Profile updated successfully"}

# ─── NEW ───
@router.get("/{user_id}/posts")
async def get_user_posts(
    user_id: str,
    token: str = Depends(oauth2_scheme)
):
    """Return posts created by a specific user.

    Token is supplied via the Authorization header (Bearer scheme) like all other
    authenticated routes. We validate it and enforce that users can only access
    their own posts unless future requirements change to allow public access.
    """

    payload = verify_access_token(token)

    # ensure they can only fetch their own posts (or drop this check if you want public profiles)
    if payload.get("sub") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return get_posts_by_user(user_id)

# ---------------------------------------------------------------------
# PUBLIC profile routes (username-based)
# ---------------------------------------------------------------------

@router.get("/username/{user_id}", tags=["Public Profiles"])
async def get_username_by_id(user_id: str):
    """PUBLIC: Return a user's username when only their ID is known.
    This is used for navigation to developer profiles.
    """
    user = get_user_from_db(user_id)
    if not user or "username" not in user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"username": user["username"]}


@router.get("/profile/by-username/{username}", tags=["Public Profiles"])
async def get_user_profile_by_username(username: str):
    """PUBLIC: Return a developer profile when only the username is known.

    Only safe, non-sensitive fields are returned so this endpoint can be
    consumed by the public website without authentication.
    """
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for key in [
        "password",
        "email_verification_code",
        "email_verification_expiry",
        "two_factor_secret",
        "two_factor_enabled",
    ]:
        user.pop(key, None)

    return user


@router.get("/by-username/{username}/posts", tags=["Public Profiles"])
async def get_posts_by_username(username: str):
    """PUBLIC: Return all posts authored by the given username."""
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return get_posts_by_user(user["user_id"])

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

@router.post("/profile/refresh-steam")
async def refresh_steam_profile(
    request: Request,
    token: str = Depends(oauth2_scheme)
):
    """Refresh Steam profile data for current user"""
    try:
        payload = verify_access_token(token)
        user_id = payload["sub"]
        
        # Get user from DB
        user = get_user_from_db(user_id)
        if not user or "steam_profile" not in user:
            raise HTTPException(status_code=400, detail="No Steam profile linked")
            
        # Refresh Steam data
        steam_id = user["steam_profile"]["steam_id"]
        steam_profile = fetch_steam_profile(steam_id)
        if not steam_profile:
            raise HTTPException(status_code=400, detail="Could not refresh Steam profile")
            
        # Update user in DB
        updates = {
            "steam_profile": steam_profile,
            "updated_at": str(datetime.utcnow())
        }
        update_user_profile(user_id, updates)
        
        return steam_profile
        
    except Exception as e:
        logger.error(f"Steam profile refresh failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error refreshing Steam profile")

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