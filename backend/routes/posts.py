from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, HttpUrl
from typing import List, Union, Optional
from pydantic.json import pydantic_encoder
import json

from backend.database import (
    get_post_from_db,
    create_post_in_db,
    get_all_posts_from_db,
    filter_posts_from_db,
)
from backend.utils.security import verify_access_token
from fastapi_limiter.depends import RateLimiter

# This will read the bearer token from the Authorization header for us
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

router = APIRouter(tags=["Posts"])  # prefix is applied when you include this router in app

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

# ---------- Routes ----------

@router.post(
    "/",
    dependencies=[Depends(RateLimiter(times=10, seconds=60))]
)
async def create_post(
    post_data: PostCreateRequest,
    token: str = Depends(oauth2_scheme),           # <-- pull token from header
):
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    genre = post_data.genre.lower()

    if genre not in ["gaming", "anime"]:
        raise HTTPException(status_code=400, detail="Invalid genre specified")

    # ✅ Ensure serializable payload before sending to DynamoDB
    serialized_post_data = post_data.post_data.model_dump()

    post_id = create_post_in_db(serialized_post_data, user_id)
    if not post_id:
        raise HTTPException(status_code=500, detail="Error creating post")

    return {"message": "Post created", "post_id": post_id}


@router.get("/{post_id}")
async def get_post(post_id: str):
    post = get_post_from_db(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.get(
    "/filter",
    dependencies=[Depends(RateLimiter(times=30, seconds=60))]
)
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


@router.get("")
async def get_all_posts_alias():
    return {"posts": get_all_posts_from_db()}


@router.get(
    "/",
    dependencies=[Depends(RateLimiter(times=40, seconds=60))]
)
async def get_all_posts():
    posts = get_all_posts_from_db()
    return {"posts": posts}
