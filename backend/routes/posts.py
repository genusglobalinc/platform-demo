from fastapi import APIRouter, Depends, HTTPException
from database import get_post_from_db, create_post_in_db
from security import verify_access_token

router = APIRouter()

# Route to create a new post (protected with JWT)
@router.post("/create")
async def create_post(post_data: dict, token: str = Depends(verify_access_token)):
    user_id = token.get("sub")
    post_id = create_post_in_db(post_data, user_id)
    return {"post_id": post_id}

# Route to get post by ID (public)
@router.get("/{post_id}")
async def get_post(post_id: str):
    post = get_post_from_db(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post
