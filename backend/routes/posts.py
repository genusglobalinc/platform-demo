# backend/routes/posts.py

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, HttpUrl
from typing import List, Union, Optional, Any
from backend.database import (
    get_post_from_db,
    create_post_in_db,
    get_all_posts_from_db,
    filter_posts_from_db
)
from backend.utils.security import verify_access_token
from fastapi_limiter.depends import RateLimiter

router = APIRouter(prefix="/posts", tags=["Posts"])

# ---------- Schemas ----------

class BasePost(BaseModel):
    title: str
    tags: List[str] = []
    studio: str
    banner_image: HttpUrl
    description: str
    images: List[HttpUrl]

class GamingPost(BasePost):
    access_instructions: Optional[str] = None
    has_nda: bool = False
    rewards: Optional[str] = None
    share_post_to_socials: bool = False
    type: str = "gaming"

class AnimePost(BasePost):
    streaming_services: List[HttpUrl]
    trailer_url: Optional[HttpUrl] = None
    type: str = "anime"

class PostCreateRequest(BaseModel):
    genre: str  # Must be "gaming" or "anime"
    post_data: Union[GamingPost, AnimePost]

def _normalize_urls(obj: Any) -> Any:
    """
    Recursively convert any HttpUrl to str, and lists of HttpUrl to list of str.
    """
    if isinstance(obj, HttpUrl):
        return str(obj)
    if isinstance(obj, list):
        return [_normalize_urls(i) for i in obj]
    if isinstance(obj, dict):
        return {k: _normalize_urls(v) for k, v in obj.items()}
    return obj

# ---------- Routes ----------

@router.post("/", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def create_post(
    post_data: PostCreateRequest,
    token: dict = Depends(verify_access_token)
):
    user_id = token.get("sub")
    genre = post_data.genre.lower()
    if genre not in ["gaming", "anime"]:
        raise HTTPException(status_code=400, detail="Invalid genre specified")

    # Convert Pydantic model to dict
    raw = post_data.post_data.dict()
    # Normalize HttpUrl fields into plain strings
    normalized = _normalize_urls(raw)

    post_id = create_post_in_db(normalized, user_id)
    if not post_id:
        raise HTTPException(status_code=500, detail="Error creating post")
    return {"message": "Post created", "post_id": post_id}


@router.get("/{post_id}")
async def get_post(post_id: str):
    post = get_post_from_db(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.get("/filter", dependencies=[Depends(RateLimiter(times=30, seconds=60))])
async def get_filtered_posts(
    tab: str = Query("Trending", enum=["Trending", "Newest", "ForYou"]),
    main: Optional[str] = Query(None),
    subs: Optional[str] = Query(None),
):
    subs_list = subs.split(",") if subs else []
    try:
        posts = filter_posts_from_db(tab=tab, main=main or "", subs=subs_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"posts": posts}


@router.get("", dependencies=[Depends(RateLimiter(times=40, seconds=60))])
async def get_all_posts():
    posts = get_all_posts_from_db()
    return {"posts": posts}


@router.get("/", dependencies=[Depends(RateLimiter(times=40, seconds=60))])
async def get_all_posts_alias():
    return await get_all_posts()
