from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from backend.models import SteamProfile, SteamLinkRequest, SteamUnlinkRequest
from backend.services.steam_service import steam_service
from backend.utils.security import verify_access_token
from backend.database import get_user_from_db, update_user_steam_data
from typing import Optional
import re

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def validate_steam_id(steam_id: str) -> bool:
    """Validate Steam ID format (64-bit Steam ID)"""
    # Steam 64-bit IDs are 17 digits starting with 765
    pattern = r'^765\d{14}$'
    return bool(re.match(pattern, steam_id))

def extract_steam_id_from_url(steam_url: str) -> Optional[str]:
    """Extract Steam ID from various Steam URL formats"""
    # Handle direct Steam ID
    if validate_steam_id(steam_url):
        return steam_url
    
    # Handle Steam profile URLs
    patterns = [
        r'steamcommunity\.com/profiles/(\d+)',
        r'steamcommunity\.com/id/([^/]+)',
        r'/profiles/(\d+)',
        r'/id/([^/]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, steam_url)
        if match:
            extracted = match.group(1)
            if validate_steam_id(extracted):
                return extracted
            # If it's a custom URL, we'd need to resolve it via Steam API
            # For now, return None and let the user provide the 64-bit ID
            return None
    
    return None

@router.get("/steam/profile/{steam_id}", response_model=SteamProfile)
async def get_steam_profile(steam_id: str, token: str = Depends(oauth2_scheme)):
    """Get Steam profile data for a given Steam ID"""
    # Verify user is authenticated
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    # Validate Steam ID format
    if not validate_steam_id(steam_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid Steam ID format. Please provide a 64-bit Steam ID (17 digits starting with 765)"
        )
    
    # Get Steam profile data
    profile_data = await steam_service.get_user_gaming_profile(steam_id)
    
    if not profile_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Steam profile not found or profile is private"
        )
    
    # Check if profile is public
    if not profile_data.get("profile_visibility", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Steam profile is private. Please make your game details public to view this information."
        )
    
    return SteamProfile(**profile_data)

@router.post("/steam/link")
async def link_steam_account(request: SteamLinkRequest, token: str = Depends(oauth2_scheme)):
    """Link a Steam account to the user's profile"""
    # Verify user is authenticated
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user_id = payload["sub"]
    
    # Extract Steam ID from URL if needed
    steam_id = extract_steam_id_from_url(request.steam_id)
    if not steam_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Steam ID or URL format. Please provide a 64-bit Steam ID or valid Steam profile URL"
        )
    
    # Validate Steam ID and get profile data
    profile_data = await steam_service.get_user_gaming_profile(steam_id)
    
    if not profile_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Steam profile not found or profile is private"
        )
    
    # Check if profile is public
    if not profile_data.get("profile_visibility", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Steam profile is private. Please make your game details public to link your account."
        )
    
    # Update user's Steam data in database
    try:
        success = update_user_steam_data(user_id, {
            "steam_id": steam_id,
            "steam_profile": profile_data,
            "linked_at": "now()"  # This will be handled by the database function
        })
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to link Steam account"
            )
        
        return {
            "message": "Steam account linked successfully",
            "steam_id": steam_id,
            "profile_name": profile_data.get("player_info", {}).get("personaname", "Unknown"),
            "total_games": profile_data.get("total_games", 0),
            "total_playtime": profile_data.get("total_playtime_formatted", "0 minutes")
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error linking Steam account: {str(e)}"
        )

@router.post("/steam/unlink")
async def unlink_steam_account(request: SteamUnlinkRequest, token: str = Depends(oauth2_scheme)):
    """Unlink Steam account from user's profile"""
    # Verify user is authenticated
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user_id = payload["sub"]
    
    if not request.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please confirm unlinking by setting confirm=true"
        )
    
    # Remove Steam data from user profile
    try:
        success = update_user_steam_data(user_id, {
            "steam_id": None,
            "steam_profile": None,
            "linked_at": None
        })
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to unlink Steam account"
            )
        
        return {"message": "Steam account unlinked successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error unlinking Steam account: {str(e)}"
        )

@router.get("/steam/my-profile", response_model=SteamProfile)
async def get_my_steam_profile(token: str = Depends(oauth2_scheme)):
    """Get the current user's linked Steam profile"""
    # Verify user is authenticated
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user_id = payload["sub"]
    
    # Get user data from database
    user = get_user_from_db(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Check if user has linked Steam account
    steam_id = user.get("steam_id")
    if not steam_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Steam account linked. Please link your Steam account first."
        )
    
    # Get fresh Steam profile data
    profile_data = await steam_service.get_user_gaming_profile(steam_id)
    
    if not profile_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Steam profile not found or profile is private"
        )
    
    # Update cached data in database
    try:
        update_user_steam_data(user_id, {
            "steam_profile": profile_data
        })
    except Exception:
        # Don't fail the request if cache update fails
        pass
    
    return SteamProfile(**profile_data)

@router.get("/steam/games/{steam_id}")
async def get_steam_games(steam_id: str, token: str = Depends(oauth2_scheme)):
    """Get detailed games list for a Steam ID"""
    # Verify user is authenticated
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    # Validate Steam ID format
    if not validate_steam_id(steam_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Steam ID format"
        )
    
    # Get owned games data
    games_data = await steam_service.get_owned_games(steam_id)
    
    if not games_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Games data not found or profile is private"
        )
    
    return games_data

@router.get("/steam/recent/{steam_id}")
async def get_recent_games(steam_id: str, count: int = 10, token: str = Depends(oauth2_scheme)):
    """Get recently played games for a Steam ID"""
    # Verify user is authenticated
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    # Validate Steam ID format
    if not validate_steam_id(steam_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Steam ID format"
        )
    
    # Get recent games data
    recent_data = await steam_service.get_recently_played_games(steam_id, count)
    
    if not recent_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recent games data not found or profile is private"
        )
    
    return recent_data
