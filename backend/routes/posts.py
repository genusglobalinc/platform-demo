from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.database import get_post_from_db, create_post_in_db
from backend.utils.security import verify_access_token

router = APIRouter()

# Pydantic model for creating a post
class PostCreateRequest(BaseModel):
    title: str
    details: str
    tags: list[str] = []  # Optional list of tags

# Endpoint to create a post (protected)
@router.post("/create")
async def create_post(post_data: PostCreateRequest, token: dict = Depends(verify_access_token)):
    user_id = token.get("sub")
    post_id = create_post_in_db(post_data.dict(), user_id)
    if not post_id:
        raise HTTPException(status_code=500, detail="Error creating post")
    return {"message": "Post created", "post_id": post_id}

# Endpoint to retrieve a post (public)
@router.get("/{post_id}")
async def get_post(post_id: str):
    post = get_post_from_db(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

from fastapi import Query
from typing import Optional
from backend.database import get_all_posts_from_db, filter_posts_from_db

# New endpoint to get posts with optional filtering
@router.get("/")
async def get_filtered_posts(
    tab: str = Query("Trending", enum=["Trending", "Newest", "ForYou"]),
    main: Optional[str] = Query(None),
    subs: Optional[str] = Query(None),
):
    """
    Return a list of posts filtered by tab, main genre, and sub genre.
    """
    # Custom filtering logic here — replace with your real DB logic
    try:
        posts = filter_posts_from_db(tab=tab, main=main, subs=subs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"posts": posts}
