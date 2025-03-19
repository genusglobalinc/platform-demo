from fastapi import APIRouter, Depends, HTTPException
from database import get_event_from_db, register_user_for_event
from security import verify_access_token

router = APIRouter()

# Route to get event details by event_id (public)
@router.get("/{event_id}")
async def get_event(event_id: str):
    event = get_event_from_db(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

# Route to register a user for an event (protected with JWT)
@router.post("/register")
async def register_for_event(event_id: str, token: str = Depends(verify_access_token)):
    user_id = token.get("sub")
    registration_id = register_user_for_event(user_id, event_id)
    return {"registration_id": registration_id}
