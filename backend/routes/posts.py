from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, HttpUrl
from typing import List, Union, Optional, Any, Dict
import json

from backend.database import (
    get_post_from_db,
    create_post_in_db,
    get_all_posts_from_db,
    filter_posts_from_db,
    delete_post_in_db,
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
    banner_image: Union[HttpUrl, Dict[str, Any]]
    description: str
    images: List[Union[HttpUrl, Dict[str, Any]]] = []

class GamingPost(BasePost):
    access_instructions: Optional[str] = None
    has_nda: bool = False
    rewards: Optional[str] = None
    share_post_to_socials: bool = False
    type: str = "gaming"

class PostCreateRequest(BaseModel):
    genre: str  # Must be "gaming" (legacy anime removed)
    post_data: GamingPost

# ---------- Routes ----------

@router.post(
    "",
    dependencies=[Depends(RateLimiter(times=10, seconds=60))]
)
async def create_post(
    post_data: PostCreateRequest,
    token: str = Depends(oauth2_scheme),
):
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    user_type = payload.get("user_type")
    if user_type != "Dev":
        raise HTTPException(status_code=403, detail="Only Dev accounts can create posts")
    print(f"[create_post] user_id={user_id} payload={payload}")
    genre = post_data.genre.lower()

    if genre != "gaming":
        raise HTTPException(status_code=400, detail="Invalid genre specified (only 'gaming' allowed)")

    # Force post type to gaming to ensure consistency
    post_data.post_data.type = "gaming"

    # Debugging log to confirm the type assignment
    print(f"Post type set to: {post_data.post_data.type}")

    # Ensure serializable payload before sending to DynamoDB
    serialized_post_data = post_data.post_data.model_dump()

    post_id = create_post_in_db(serialized_post_data, user_id)
    if not post_id:
        raise HTTPException(status_code=500, detail="Error creating post")

    return {"message": "Post created", "post_id": post_id}

# Also expose the same handler at '/posts/' to accept trailing slash requests
router.add_api_route(
    path="/",
    endpoint=create_post,
    methods=["POST"],
    dependencies=[Depends(RateLimiter(times=10, seconds=60))],
    response_model=None,
    include_in_schema=False,
)

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

# ----------------- Delete -----------------

@router.delete("/{post_id}")
async def delete_post(post_id: str, token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    print(f"[delete_post] user {user_id} wants to delete {post_id}")
    success = delete_post_in_db(post_id, user_id)
    if not success:
        raise HTTPException(status_code=403, detail="Delete failed or not authorized")
    return {"message": "Post deleted"}
