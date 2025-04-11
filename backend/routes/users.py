from fastapi import APIRouter, Depends, HTTPException
from backend.routes.users import router as users_router
from backend.utils.security import verify_access_token

router = APIRouter()

# Route to get user profile (protected with JWT)
@router.get("/profile")
async def get_profile(token: str = Depends(verify_access_token)):
    user_id = token.get("sub")
    user = get_user_from_db(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
