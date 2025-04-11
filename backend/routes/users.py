from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, EmailStr
from backend.database import get_user_from_db, update_user_profile
import logging

router = APIRouter()
logging.basicConfig(level=logging.DEBUG)

# Existing endpoint to retrieve user profile
@router.get("/profile")
async def get_profile(token: dict = Depends(lambda: _get_verified_token())):
    user_id = token.get("sub")
    from backend.database import get_user_from_db
    user = get_user_from_db(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# New model for profile update request
class UpdateProfileRequest(BaseModel):
    email: EmailStr  # Using email as the key for identifying the user
    display_name: str = None
    social_links: dict = None
    profile_picture: str = None

# New endpoint for updating user profile
@router.put("/profile/update")
async def update_profile(update_data: UpdateProfileRequest, token: dict = Depends(lambda: _get_verified_token())):
    # Optionally, check if the token's email matches update_data.email
    updated = update_user_profile(update_data.email, update_data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=500, detail="Error updating profile")
    return {"message": "Profile updated successfully"}

# Helper function to get verified token; avoids circular import
def _get_verified_token():
    from backend.utils.security import verify_access_token
    return verify_access_token

@router.put("/profile")
async def update_profile(data: dict, token: dict = Depends(lambda: _get_verified_token())):
    user_id = token.get("sub")
    from backend.database import update_user_display_name
    updated = update_user_display_name(user_id, data.get("display_name"))
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Profile updated"}
