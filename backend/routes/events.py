from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from backend.utils.security import verify_access_token
from backend.database import (
    get_event_from_db, 
    register_user_for_event,
    create_post_in_db,
    get_user_from_db
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# ✅ Model for event creation
class EventCreate(BaseModel):
    content: str

# ✅ Create an event (POST /events)
@router.post("", dependencies=[Depends(oauth2_scheme)])
async def create_event(event: EventCreate, token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = get_user_from_db(payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    post_id = create_post_in_db({"content": event.content}, user["user_id"])
    return {"message": "Event created", "post_id": post_id}

# Get a specific event (GET /events/{event_id})
@router.get("/{event_id}")
async def get_event(event_id: str):
    event = get_event_from_db(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

# Register for an event (POST /events/register?event_id=123)
@router.post("/register")
async def register_for_event(event_id: str, token: str = Depends(verify_access_token)):
    user_id = token.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    registration_id = register_user_for_event(user_id, event_id)
    return {"registration_id": registration_id}
