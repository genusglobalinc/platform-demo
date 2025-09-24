from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from typing import Dict, Any

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
    two_factor_enabled: bool = False
    two_factor_secret: Optional[str] = None
    user_type: str  # "Dev" or "Tester"

    class Config:
        orm_mode = True

# Model for User Registration (for creating a new user)
class UserRegistration(BaseModel):
    username: str
    email: EmailStr
    password: str
    is_verified: bool = False
    user_type: Optional[str] = "Dev"  # "Dev" or "Tester"

# Model for User Verification Response
class UserVerificationResponse(BaseModel):
    email: EmailStr
    is_verified: bool

# Model for response when user verification is successful
class VerificationResponse(BaseModel):
    message: str

# Model for 2FA setup response
class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code: str
    manual_entry_key: str

# Model for 2FA verification request
class TwoFactorVerifyRequest(BaseModel):
    code: str

# Model for 2FA login response
class TwoFactorLoginResponse(BaseModel):
    requires_2fa: bool
    requires_setup: bool = False
    temp_token: Optional[str] = None
    access_token: Optional[str] = None
    token_type: Optional[str] = None

# Model for forgot password request
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# Model for reset password request
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# Steam-related models
class SteamGame(BaseModel):
    appid: int
    name: str
    playtime_minutes: int
    playtime_formatted: str
    playtime_2weeks: Optional[int] = 0
    img_icon_url: Optional[str] = ""
    img_logo_url: Optional[str] = ""

class SteamPlayerInfo(BaseModel):
    steamid: str
    personaname: Optional[str] = ""
    profileurl: Optional[str] = ""
    avatar: Optional[str] = ""
    avatarmedium: Optional[str] = ""
    avatarfull: Optional[str] = ""
    personastate: Optional[int] = 0
    communityvisibilitystate: Optional[int] = 1
    profilestate: Optional[int] = 0
    lastlogoff: Optional[int] = 0
    commentpermission: Optional[int] = 0

class SteamProfile(BaseModel):
    steam_id: str
    player_info: SteamPlayerInfo
    steam_level: Optional[int] = None
    total_games: int
    total_playtime_minutes: int
    total_playtime_formatted: str
    owned_games: List[SteamGame]
    recent_games: List[Dict[str, Any]]
    top_games: List[SteamGame]
    profile_visibility: bool

class SteamLinkRequest(BaseModel):
    steam_id: str

class SteamUnlinkRequest(BaseModel):
    confirm: bool = True
