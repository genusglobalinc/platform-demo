from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from typing import Union, Optional
from passlib.context import CryptContext
import logging
import os

# Load secret securely
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable not set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme used to extract the Bearer token from the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__default_rounds=12, deprecated="auto")

# Logging
logging.basicConfig(level=logging.DEBUG)

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None) -> str:
    """Generate a JWT access token."""
    try:
        logging.debug(f"Creating access token with data: {data}")  # TODO: Remove later
        to_encode = data.copy()
        to_encode.update({"user_type": data.get("user_type")})
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})
        logging.debug(f"Token expiration time set to: {expire}")  # TODO: Remove later
        token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logging.debug("JWT token created successfully")  # TODO: Remove later
        print("JWT token created successfully")  # TODO: Remove later
        return token
    except Exception as e:
        logging.error(f"JWT creation error: {e}")
        print(f"JWT creation error: {e}")  # TODO: Remove later
        raise HTTPException(status_code=500, detail="Error creating token")

def verify_access_token(token: str) -> dict:
    """Verify and decode a JWT token."""
    try:
        logging.debug(f"Verifying JWT token: {token}")  # TODO: Remove later
        print(f"Verifying JWT token: {token}")  # TODO: Remove later
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logging.debug(f"JWT verified successfully. Payload: {payload}")  # TODO: Remove later
        print("JWT verified successfully")  # TODO: Remove later
        return payload
    except JWTError as e:
        logging.warning(f"Invalid token: {e}")
        print(f"Invalid token: {e}")  # TODO: Remove later
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception as e:
        logging.error(f"Token validation error: {e}")
        print(f"Token validation error: {e}")  # TODO: Remove later
        raise HTTPException(status_code=500, detail="Token validation failed")

def get_expiring_token(data: dict, minutes: int = 15) -> str:
    """Generate a short-lived token."""
    logging.debug(f"Generating short-lived token for: {data}")  # TODO: Remove later
    print(f"Generating short-lived token for: {data}")  # TODO: Remove later
    return create_access_token(data, timedelta(minutes=minutes))

def hash_password(password: str) -> str:
    """Hash the password using bcrypt."""
    logging.debug(f"Hashing password: {password}")  # TODO: Remove later
    print(f"Hashing password: {password}")  # TODO: Remove later
    try:
        hashed = pwd_context.hash(password)
        logging.debug(f"Password hashed: {hashed}")  # TODO: Remove later
        print(f"Password hashed: {hashed}")  # TODO: Remove later
        return hashed
    except Exception as e:
        logging.error(f"Password hashing failed: {e}")
        print(f"Password hashing failed: {e}")  # TODO: Remove later
        raise HTTPException(status_code=500, detail="Error hashing password")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify the entered password against the hashed password."""
    logging.debug(f"Verifying password\nPlain: {plain_password}\nHashed: {hashed_password}")  # TODO: Remove later
    print(f"Verifying password\nPlain: {plain_password}\nHashed: {hashed_password}")  # TODO: Remove later
    try:
        result = pwd_context.verify(plain_password, hashed_password)
        logging.debug(f"Password verification result: {result}")  # TODO: Remove later
        print(f"Password verification result: {result}")  # TODO: Remove later
        return result
    except Exception as e:
        logging.error(f"Password verification failed: {e}")
        print(f"Password verification failed: {e}")  # TODO: Remove later
        raise HTTPException(status_code=401, detail="Invalid credentials (verification error)")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Get the current user from the Bearer token provided in the Authorization header."""
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    from ..database import get_user_by_id  # Import here to avoid circular imports
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_admin_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Return the authenticated admin user or raise 403/401 accordingly."""
    user = await get_current_user(token)
    if user.get("user_type") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user
