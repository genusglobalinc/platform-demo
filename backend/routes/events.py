from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_events():
    return {"events": ["Event1", "Event2"]}
