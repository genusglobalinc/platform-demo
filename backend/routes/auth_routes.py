# backend/routes/auth_routes.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from backend.utils.security import create_access_token, verify_access_token, verify_password
from backend.database import (
    get_user_by_username,
    get_user_by_email,
    get_user_from_db,
    update_user_verification,
    create_user_in_db,
    update_reset_token,
    update_user_password
)
import logging

router = APIRouter()
logging.basicConfig(level=logging.DEBUG)

# ---------------- Models ---------------- 
class LoginRequest(BaseModel):
    username: str
    password: str

class UserRegistration(BaseModel):
    username: str
    email: EmailStr
    password: str
    display_name: str
    social_links: str  # comma-separated, or JSON if you like
    profile_picture: str
    is_verified: bool = True

class UsernameRecoveryRequest(BaseModel):
    user_id: str

class EmailVerificationRequest(BaseModel):
    email: EmailStr

class VerifyTokenRequest(BaseModel):
    token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# --------------- Routes ----------------

@router.post("/register")
async def register_user(user_data: UserRegistration):
    try:
        logging.debug(f"Attempting to register user: {user_data.username}")
        if get_user_by_username(user_data.username):
            logging.warning(f"Username already exists: {user_data.username}")
            raise HTTPException(status_code=400, detail="Username already exists")
        if get_user_by_email(user_data.email):
            logging.warning(f"Email already exists: {user_data.email}")
            raise HTTPException(status_code=400, detail="Email already exists")

        # build dict; we'll let create_user_in_db hash the password once
        user_dict = user_data.dict()
        user_id = create_user_in_db(user_dict)
        if not user_id:
            logging.error("create_user_in_db returned None")
            raise HTTPException(status_code=500, detail="Error creating user")

        logging.info(f"User registered successfully with ID: {user_id}")
        return {"message": "User registered successfully", "user_id": user_id}

    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Unexpected error during registration")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/token")
async def login(request: LoginRequest):
    try:
        logging.debug(f"Login attempt for user: {request.username}")
        user = get_user_by_username(request.username)
        if not user or not verify_password(request.password, user["password"]):
            logging.warning(f"Invalid credentials for user: {request.username}")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        access_token = create_access_token(data={"sub": user["user_id"]})
        logging.debug(f"Access token generated for user: {user['user_id']}")
        return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Unexpected error during login")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@router.post("/recover-username")
async def recover_username(data: UsernameRecoveryRequest):
    try:
        user = get_user_from_db(data.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"username": user.get("username")}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Username recovery failed")
        raise HTTPException(status_code=500, detail=f"Recovery failed: {str(e)}")


@router.post("/verify-email")
async def send_verification_email(data: EmailVerificationRequest):
    try:
        user = get_user_by_email(data.email)
        if not user:
            raise HTTPException(status_code=404, detail="Email not registered")

        token = create_access_token({"sub": data.email}, timedelta(minutes=15))
        logging.debug(f"Verification token created for: {data.email}")
        return {"verification_token": token}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Error sending verification token")
        raise HTTPException(status_code=500, detail=f"Failed to generate token: {str(e)}")


@router.post("/confirm-verification")
async def confirm_email_verification(data: VerifyTokenRequest):
    try:
        payload = verify_access_token(data.token)
        email = payload.get("sub")
        if not update_user_verification(email, True):
            raise HTTPException(status_code=500, detail="Failed to verify email")
        logging.info(f"Email verified for: {email}")
        return {"message": "Email verified"}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Email verification failed")
        raise HTTPException(status_code=400, detail="Invalid or expired token")


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    try:
        user = get_user_by_email(request.email)
        if not user:
            raise HTTPException(status_code=404, detail="Email not registered")

        reset_token = create_access_token({"sub": request.email}, timedelta(minutes=15))
        if not update_reset_token(request.email, reset_token):
            raise HTTPException(status_code=500, detail="Error updating reset token")

        logging.debug(f"Password reset token created for: {request.email}")
        return {"reset_token": reset_token, "message": "Password reset token sent via email (mock)"}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Forgot password flow failed")
        raise HTTPException(status_code=500, detail=f"Forgot password failed: {str(e)}")


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    try:
        payload = verify_access_token(request.token)
        email = payload.get("sub")

        user = get_user_by_email(email)
        if not user or user.get("reset_token") != request.token:
            raise HTTPException(status_code=400, detail="Token mismatch or expired")

        if not update_user_password(email, request.new_password):
            raise HTTPException(status_code=500, detail="Error resetting password")

        logging.info(f"Password reset for: {email}")
        return {"message": "Password has been reset successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Reset password flow failed")
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")
