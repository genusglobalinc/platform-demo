from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.utils.security import create_access_token, verify_access_token, verify_password
from backend.database import get_user_from_db
import logging

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.DEBUG)

class LoginRequest(BaseModel):
    username: str
    password: str

# Route for user login and token generation
@router.post("/token")
async def login(request: LoginRequest):
    logging.debug(f"Login request received for username: {request.username}")
    
    user = get_user_from_db(request.username)
    if not user:
        logging.warning(f"User not found: {request.username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(request.password, user['password']):
        logging.warning(f"Incorrect password for user: {request.username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate a JWT token upon successful login
    try:
        access_token = create_access_token(data={"sub": user['user_id']})
        logging.debug(f"JWT token generated for user: {user['user_id']}")
    except Exception as e:
        logging.error(f"Error generating JWT token: {e}")
        raise HTTPException(status_code=500, detail="Error generating token")
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/recover-username")
async def recover_username(data: UsernameRecoveryRequest):
    user = get_user_by_id(data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"username": user.get("username", None)}

@router.post("/verify-email")
async def send_verification_email(data: EmailVerificationRequest):
    user = get_user_by_email(data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Email not registered")

    token = create_access_token({"sub": data.email}, timedelta(minutes=15))
    # You'd send this via email; for now we just return it for frontend testing
    return {"verification_token": token}

@router.post("/confirm-verification")
async def confirm_email_verification(data: VerifyTokenRequest):
    try:
        payload = verify_access_token(data.token)
        email = payload.get("sub")
        success = update_user_verification(email, True)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to verify")
        return {"message": "Email verified"}
    except:
        raise HTTPException(status_code=400, detail="Invalid or expired token")