from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Model for Login Request
class LoginRequest(BaseModel):
    username: str
    password: str

# Model for Token Response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str

# Model for Username Recovery Request
class UsernameRecoveryRequest(BaseModel):
    user_id: str

# Model for Email Verification Request
class EmailVerificationRequest(BaseModel):
    email: EmailStr

# Model for Token Verification Request
class VerifyTokenRequest(BaseModel):
    token: str

# Model for the User Object (for fetching user data)
class User(BaseModel):
    user_id: str
    username: str
    email: EmailStr
    password: str  # Hashed password
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

# Model for User Registration (for creating a new user)
class UserRegistration(BaseModel):
    username: str
    email: EmailStr
    password: str
    is_verified: bool = False

# Model for User Verification Response
class UserVerificationResponse(BaseModel):
    email: EmailStr
    is_verified: bool

# Model for response when user verification is successful
class VerificationResponse(BaseModel):
    message: str
