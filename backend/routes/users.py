# backend/routes/user.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import logging
from fastapi.security import OAuth2PasswordBearer

from backend.database import get_user_from_db, update_user_profile
from backend.utils.security import verify_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter(tags=["Users"])  # ⬅️ remove `prefix="/users"`
logging.basicConfig(level=logging.DEBUG)

class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None
    profile_picture: Optional[str] = None

@router.get("/profile")
async def get_profile(token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    logging.debug(f"Fetching profile for user_id: {user_id}")
    user = get_user_from_db(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/profile")
async def update_profile(
    update_data: UpdateProfileRequest,
    token: str = Depends(oauth2_scheme)
):
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    updates = update_data.dict(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    success = update_user_profile(user_id, updates)
    if not success:
        raise HTTPException(status_code=500, detail="Error updating profile")
    return {"message": "Profile updated successfully"}

# ─── NEW ───
@router.get("/{user_id}/posts")
async def get_user_posts(
    user_id: str,
    token: dict = Depends(verify_access_token)
):
    # ensure they can only fetch their own posts (or drop this check if you want public profiles)
    if token.get("sub") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return get_posts_by_user(user_id)