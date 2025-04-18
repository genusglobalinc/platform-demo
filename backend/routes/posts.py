from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, HttpUrl
from typing import List, Union, Optional
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

router = APIRouter(tags=["Posts"])

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
    # Override BasePost fields to make them optional / defaulted
    studio: Optional[str] = ""
    banner_image: Optional[HttpUrl] = "https://via.placeholder.com/600x200"
    images: List[HttpUrl] = []
    streaming_services: List[HttpUrl] = []
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
    token: str = Depends(oauth2_scheme),
):
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    genre = post_data.genre.lower()

    if genre not in ["gaming", "anime"]:
        raise HTTPException(status_code=400, detail="Invalid genre specified")

    # Ensure that the post type matches the genre
    if genre == "gaming":
        post_data.post_data.type = "gaming"
    elif genre == "anime":
        post_data.post_data.type = "anime"

    # Debugging log to confirm the type assignment
    print(f"Post type set to: {post_data.post_data.type}")

    # Ensure serializable payload before sending to DynamoDB
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
async def get_all_posts_alias(
    genre: Optional[str] = Query(None, description="Filter by genre/post_type"),
    tags: Optional[str] = Query(None, description="Comma-separated list of tags"),
):
    tag_list = tags.split(",") if tags else []
    posts = get_all_posts_from_db(post_type=genre, tags=tag_list if tags else None)

    # Ensure that all posts are serialized correctly before returning
    serialized_posts = json.dumps(posts, default=str)
    return {"posts": json.loads(serialized_posts)}

@router.get(
    "/",
    dependencies=[Depends(RateLimiter(times=40, seconds=60))]
)
async def get_all_posts(
    genre: Optional[str] = Query(None, description="Filter by genre/post_type"),
    tags: Optional[List[str]] = Query(None, description="List of tags"),
):
    # tags will automatically be a list if passed multiple times
    posts = get_all_posts_from_db(post_type=genre, tags=tags)
    serialized_posts = json.dumps(posts, default=str)
    return {"posts": json.loads(serialized_posts)}
