from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException
from typing import Union
from passlib.context import CryptContext
import logging
import os

# Secret key to encode and decode JWT tokens (ensure you load it securely from env)
SECRET_KEY = os.getenv("SECRET_KEY", "your_default_secret_key")  # Replace in prod
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Function to create a JWT token
def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    try:
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logging.debug("JWT token created (masked)")
        return encoded_jwt
    except Exception as e:
        logging.error(f"Error creating JWT token: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while creating token")

# Function to verify JWT token
def verify_access_token(token: str):
    try:
        logging.debug("Verifying JWT token")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logging.debug(f"Token verified successfully. Payload: {payload}")
        return payload
    except JWTError as e:
        logging.error(f"Token validation failed: {e}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception as e:
        logging.error(f"Unexpected error during token validation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during token validation")

# Create a short-lived token
def get_expiring_token(data: dict, minutes: int = 15):
    return create_access_token(data, timedelta(minutes=minutes))

# Password hashing
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)
