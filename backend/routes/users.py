from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()

# Route to get user profile (protected with JWT)
@router.get("/profile")
async def get_profile(token: str = Depends(lambda: _get_verified_token())):
    user_id = token.get("sub")
    user = get_user_from_db(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Local import to avoid circular import issue
def _get_verified_token():
    from backend.utils.security import verify_access_token
    return verify_access_token
