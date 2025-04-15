from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException
from typing import Union
from passlib.context import CryptContext
import logging
import os

# Load secret securely
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable not set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Logging
logging.basicConfig(level=logging.DEBUG)

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None) -> str:
    """Generate a JWT access token."""
    try:
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})
        token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logging.debug("JWT token created successfully")
        print("JWT token created successfully")
        return token
    except Exception as e:
        logging.error(f"JWT creation error: {e}")
        print(f"JWT creation error: {e}")
        raise HTTPException(status_code=500, detail="Error creating token")

def verify_access_token(token: str) -> dict:
    """Verify and decode a JWT token."""
    try:
        logging.debug(f"Verifying JWT token: {token}")
        print(f"Verifying JWT token: {token}")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logging.debug("JWT verified successfully")
        print("JWT verified successfully")
        return payload
    except JWTError as e:
        logging.warning(f"Invalid token: {e}")
        print(f"Invalid token: {e}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception as e:
        logging.error(f"Token validation error: {e}")
        print(f"Token validation error: {e}")
        raise HTTPException(status_code=500, detail="Token validation failed")

def get_expiring_token(data: dict, minutes: int = 15) -> str:
    """Generate a short-lived token."""
    logging.debug(f"Generating short-lived token for: {data}")
    print(f"Generating short-lived token for: {data}")
    return create_access_token(data, timedelta(minutes=minutes))

def hash_password(password: str) -> str:
    logging.debug(f"Hashing password: {password}")
    print(f"Hashing password: {password}")
    try:
        hashed = pwd_context.hash(password)
        logging.debug(f"Password hashed: {hashed}")
        print(f"Password hashed: {hashed}")
        return hashed
    except Exception as e:
        logging.error(f"Password hashing failed: {e}")
        print(f"Password hashing failed: {e}")
        raise

def verify_password(plain_password: str, hashed_password: str) -> bool:
    logging.debug(f"Verifying password\nPlain: {plain_password}\nHashed: {hashed_password}")
    print(f"Verifying password\nPlain: {plain_password}\nHashed: {hashed_password}")
    try:
        result = pwd_context.verify(plain_password, hashed_password)
        logging.debug(f"Password verification result: {result}")
        print(f"Password verification result: {result}")
        return result
    except Exception as e:
        logging.error(f"Password verification failed: {e}")
        print(f"Password verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials (verification error)")
