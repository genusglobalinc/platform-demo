from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from backend.utils.security import create_access_token, verify_access_token, verify_password, hash_password
from backend.database import (
    get_user_by_username,
    get_user_from_db,
    update_user_verification,
    create_user_in_db,
    update_reset_token,
    update_user_password
)
import logging

router = APIRouter()
logging.basicConfig(level=logging.DEBUG)

# Models for requests
class LoginRequest(BaseModel):
    username: str
    password: str

class UserRegistration(BaseModel):
    username: str
    email: EmailStr
    password: str
    is_verified: bool = False

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

# Registration Endpoint
@router.post("/register")
async def register_user(user_data: UserRegistration):
    existing_user = get_user_by_username(user_data.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = hash_password(user_data.password)
    user_data.password = hashed_password

    user_id = create_user_in_db(user_data.dict())
    if not user_id:
        raise HTTPException(status_code=500, detail="Error creating user")
    
    return {"message": "User registered successfully", "user_id": user_id}

# Login Endpoint
@router.post("/token")
async def login(request: LoginRequest):
    logging.debug(f"Login request received for username: {request.username}")
    
    user = get_user_by_username(request.username)
    if not user:
        logging.warning(f"User not found: {request.username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(request.password, user['password']):
        logging.warning(f"Incorrect password for user: {request.username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    try:
        access_token = create_access_token(data={"sub": user['user_id']})
        logging.debug(f"JWT token generated for user: {user['user_id']}")
    except Exception as e:
        logging.error(f"Error generating JWT token: {e}")
        raise HTTPException(status_code=500, detail="Error generating token")
    
    return {"access_token": access_token, "token_type": "bearer"}

# Username Recovery Endpoint
@router.post("/recover-username")
async def recover_username(data: UsernameRecoveryRequest):
    user = get_user_from_db(data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"username": user.get("username", None)}

# Send Verification Email Endpoint (returns token for testing)
@router.post("/verify-email")
async def send_verification_email(data: EmailVerificationRequest):
    user = get_user_by_username(data.email)  # Use a dedicated get_user_by_email if available
    if not user:
        raise HTTPException(status_code=404, detail="Email not registered")
    
    token = create_access_token({"sub": data.email}, timedelta(minutes=15))
    return {"verification_token": token}

# Confirm Email Verification Endpoint
@router.post("/confirm-verification")
async def confirm_email_verification(data: VerifyTokenRequest):
    try:
        payload = verify_access_token(data.token)
        email = payload.get("sub")
        success = update_user_verification(email, True)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to verify")
        return {"message": "Email verified"}
    except Exception as e:
        logging.error(f"Error confirming email verification: {e}")
        raise HTTPException(status_code=400, detail="Invalid or expired token")

# Forgot Password Endpoint: sends reset token (mock)
@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    user = get_user_by_username(request.email)  # Adjust if you have get_user_by_email
    if not user:
        raise HTTPException(status_code=404, detail="Email not registered")
    
    reset_token = create_access_token({"sub": request.email}, timedelta(minutes=15))
    updated = update_reset_token(request.email, reset_token)
    if not updated:
        raise HTTPException(status_code=500, detail="Error updating reset token")
    
    return {"reset_token": reset_token, "message": "Password reset token sent via email (mock)"}

# Reset Password Endpoint
@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    try:
        payload = verify_access_token(request.token)
        email = payload.get("sub")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user = get_user_by_username(email)  # Adjust if you have get_user_by_email
    if not user or user.get("reset_token") != request.token:
        raise HTTPException(status_code=400, detail="Token mismatch or expired")
    
    new_hashed = hash_password(request.new_password)
    updated = update_user_password(email, new_hashed)
    if not updated:
        raise HTTPException(status_code=500, detail="Error resetting password")
    
    return {"message": "Password has been reset successfully"}
