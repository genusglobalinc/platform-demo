from fastapi import APIRouter, Depends, HTTPException
from utils.security import verify_token

router = APIRouter()

@router.get("/protected", dependencies=[Depends(verify_token)])
def protected_route():
    return {"message": "You have access to this protected route"}
