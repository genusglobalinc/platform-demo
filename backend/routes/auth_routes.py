from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from security import create_access_token, verify_access_token
from database import get_user_from_db

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

# Route for user login and token generation
@router.post("/token")
async def login(request: LoginRequest):
    user = get_user_from_db(request.username)
    if not user or not verify_password(request.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate a JWT token upon successful login
    access_token = create_access_token(data={"sub": user['user_id']})
    return {"access_token": access_token, "token_type": "bearer"}
