# backend/routes/auth_routes.py

from jose import jwt, JWTError
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import timedelta
import logging
import pyotp
import qrcode
import io
import base64
from backend.utils.security import create_access_token, verify_access_token, verify_password
from backend.models import (
    TwoFactorLoginResponse,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
    UserRegistration,
    UsernameRecoveryRequest,
    EmailVerificationRequest,
    VerifyTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    LoginRequest
)
from backend.database import (
    get_user_by_username,
    get_user_by_email,
    get_user_from_db,
    create_user_in_db,
    update_user_verification,
    update_reset_token,
    update_user_password,
    update_user_2fa,
    verify_2fa_code
)
import pyotp
import qrcode
import io
import base64

router = APIRouter()
logging.basicConfig(level=logging.DEBUG)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# ---------------- Models ---------------- 

class LoginRequest(BaseModel):
    username: str
    password: str

class UserRegistration(BaseModel):
    username: str
    email: EmailStr
    password: str
    display_name: str
    social_links: Optional[str] = None
    profile_picture: Optional[str] = None
    is_verified: bool = True
    user_type: Optional[str] = "Tester"  # "Dev", "Tester", or "Admin"

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

        # Validate user_type
        if user_data.user_type not in ("Dev", "Tester", "Admin"):
            raise HTTPException(status_code=400, detail="Invalid user_type. Must be 'Dev', 'Tester', or 'Admin'.")

        if get_user_by_username(user_data.username):
            logging.warning(f"Username already exists: {user_data.username}")
            raise HTTPException(status_code=400, detail="Username already exists")
        if get_user_by_email(user_data.email):
            logging.warning(f"Email already exists: {user_data.email}")
            raise HTTPException(status_code=400, detail="Email already exists")

        user_dict = user_data.dict()
        
        # Generate 2FA secret for the new user
        secret = pyotp.random_base32()
        user_dict['two_factor_secret'] = secret
        user_dict['two_factor_enabled'] = True  # 2FA is mandatory
        
        # create_user_in_db will hash password internally
        user_id = create_user_in_db(user_dict)
        if not user_id:
            logging.error("create_user_in_db returned None")
            raise HTTPException(status_code=500, detail="Error creating user")

        # Generate QR code for 2FA setup
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user_data.email,
            issuer_name="Lost Gates"
        )

        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        # Convert QR code to base64 string
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_code = base64.b64encode(buffered.getvalue()).decode()

        logging.info(f"User registered successfully with ID: {user_id}")
        
        # Generate temp token for 2FA setup
        temp_token = create_access_token(
            data={"sub": user_id, "temp": True},
            expires_delta=timedelta(minutes=15)
        )
        
        return {
            "message": "User registered successfully",
            "user_id": user_id,
            "temp_token": temp_token,
            "two_factor_setup": {
                "qr_code": f"data:image/png;base64,{qr_code}",
                "manual_entry_key": secret
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Unexpected error during registration")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/token", response_model=TwoFactorLoginResponse)
async def login(request: LoginRequest):
    try:
        logging.debug(f"Login attempt for user: {request.username}")
        user = get_user_by_username(request.username)
        if not user or not verify_password(request.password, user["password"]):
            logging.warning(f"Invalid credentials for user: {request.username}")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # If 2FA is not enabled, generate a setup token
        if not user.get("two_factor_enabled", False):
            setup_token = create_access_token(
                data={"sub": user["user_id"], "temp": True},
                expires_delta=timedelta(minutes=15)
            )
            return TwoFactorLoginResponse(
                requires_2fa=True,
                requires_setup=True,
                temp_token=setup_token
            )

        # If 2FA is enabled, generate a temporary token
        temp_token = create_access_token(
            data={"sub": user["user_id"], "temp": True},
            expires_delta=timedelta(minutes=5)
        )
        return TwoFactorLoginResponse(
            requires_2fa=True,
            temp_token=temp_token
        )

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

@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(token: str = Depends(oauth2_scheme)):
    token_data = verify_access_token(token)
    try:
        user_id = token_data.get("sub")
        user = get_user_from_db(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Generate new TOTP secret
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)

        # Generate QR code
        provisioning_uri = totp.provisioning_uri(
            name=user["email"],
            issuer_name="Lost Gates"
        )

        # Create QR code image
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        # Convert QR code to base64 string
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_code = base64.b64encode(buffered.getvalue()).decode()

        # Store secret in database (but don't enable 2FA yet)
        if not update_user_2fa(user_id, secret, enabled=False):
            raise HTTPException(status_code=500, detail="Failed to save 2FA secret")

        return TwoFactorSetupResponse(
            secret=secret,
            qr_code=f"data:image/png;base64,{qr_code}",
            manual_entry_key=secret
        )

    except Exception as e:
        logging.exception("2FA setup failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/2fa/verify")
async def verify_2fa(request: TwoFactorVerifyRequest, token: str = Depends(oauth2_scheme)):
    token_data = verify_access_token(token)
    try:
        user_id = token_data.get("sub")
        user = get_user_from_db(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify the code
        if not verify_2fa_code(user_id, request.code):
            raise HTTPException(status_code=400, detail="Invalid 2FA code")

        # Enable 2FA for the user after successful verification
        if not update_user_2fa(user_id, user.get("two_factor_secret"), enabled=True):
            raise HTTPException(status_code=500, detail="Failed to enable 2FA")

        return {"message": "2FA verification successful"}

    except Exception as e:
        logging.exception("2FA verification failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/2fa/login")
async def verify_2fa_login(request: TwoFactorVerifyRequest, token: str = Depends(oauth2_scheme)):
    try:
        # First verify the token
        token_data = verify_access_token(token)
        
        # Check if it's a temp token or setup token
        if not token_data.get("temp", False):
            logging.error(f"Token is not a temp token: {token_data}")
            raise HTTPException(status_code=400, detail="Invalid token type")

        user_id = token_data.get("sub")
        if not user_id:
            logging.error("No user_id in token")
            raise HTTPException(status_code=400, detail="Invalid token")

        user = get_user_from_db(user_id)
        if not user:
            logging.error(f"User not found: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        # Verify the code
        if not verify_2fa_code(user_id, request.code):
            logging.error(f"Invalid 2FA code for user: {user_id}")
            raise HTTPException(status_code=400, detail="Invalid 2FA code")

        # Generate the actual access token including user_type for downstream role checks
        access_token = create_access_token(
            data={
                "sub": user_id,
                "user_type": user.get("user_type", "Tester"),
                "temp": False,
            }
        )
        return {"access_token": access_token, "token_type": "bearer"}

    except JWTError:
        logging.exception("JWT validation failed")
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("2FA login verification failed")
        raise HTTPException(status_code=500, detail=str(e))
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
