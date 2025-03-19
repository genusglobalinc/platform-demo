from fastapi import APIRouter, Depends
from models import User
from auth import verify_token

router = APIRouter()

@router.get("/", response_model=list[User], dependencies=[Depends(verify_token)])
def get_users():
    return [
        {"id": "1", "username": "user1", "email": "user1@example.com"},
        {"id": "2", "username": "user2", "email": "user2@example.com"}
    ]
