from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException
from typing import Union
import logging

# Secret key to encode and decode JWT tokens
SECRET_KEY = "your_secret_key_here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Function to create a JWT token
def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logging.debug(f"JWT token created: {encoded_jwt}")  # Log the generated token (be careful with sensitive data)
        
        return encoded_jwt
    except Exception as e:
        logging.error(f"Error creating JWT token: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while creating token")

# Function to verify JWT token
def verify_access_token(token: str):
    try:
        logging.debug(f"Verifying JWT token: {token}")  # Log the token being verified (be careful with sensitive data)
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logging.debug(f"Token verified successfully. Payload: {payload}")  # Log the payload

        return payload
    except JWTError as e:
        logging.error(f"Token validation failed: {e}")
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials"
        )
    except Exception as e:
        logging.error(f"Unexpected error during token validation: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during token validation"
        )

def get_expiring_token(data: dict, minutes: int = 15):
    return create_access_token(data, timedelta(minutes=minutes))
