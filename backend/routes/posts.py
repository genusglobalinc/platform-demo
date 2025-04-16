from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, HttpUrl
from typing import List, Union, Optional
from backend.database import (
    get_post_from_db, 
    create_post_in_db, 
    get_all_posts_from_db, 
    filter_posts_from_db
)
from backend.utils.security import verify_access_token
from fastapi_limiter.depends import RateLimiter

router = APIRouter()

# Base Post Schema (Common fields for both Gaming and Anime)
class BasePost(BaseModel):
    title: str
    tags: List[str] = []
    studio: str
    banner_image: HttpUrl
    description: str
    images: List[HttpUrl]

# Gaming Post Schema (Extends BasePost)
class GamingPost(BasePost):
    access_instructions: Optional[str] = None
    has_nda: bool = False
    rewards: Optional[str] = None
    share_post_to_socials: bool = False
    type: str = "gaming"

# Anime Post Schema (Extends BasePost)
class AnimePost(BasePost):
    streaming_services: List[HttpUrl]
    trailer_url: Optional[HttpUrl] = None
    type: str = "anime"

# Post Create Request Schema
class PostCreateRequest(BaseModel):
    genre: str  # Either "gaming" or "anime"
    post_data: Union[GamingPost, AnimePost]  # The actual post data

# Endpoint to create a post (protected)
@router.post("/", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def create_post(post_data: PostCreateRequest, token: dict = Depends(verify_access_token)):
    user_id = token.get("sub")
    
    if post_data.genre.lower() == "gaming":
        # Convert the GamingPost instance to a dictionary
        post_id = create_post_in_db(post_data.post_data.dict(), user_id)
    
    elif post_data.genre.lower() == "anime":
        # Convert the AnimePost instance to a dictionary
        post_id = create_post_in_db(post_data.post_data.dict(), user_id)
    
    else:
        raise HTTPException(status_code=400, detail="Invalid genre specified")
    
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

# Endpoint to get posts with optional filtering
@router.get("/filter", dependencies=[Depends(RateLimiter(times=30, seconds=60))])
async def get_filtered_posts(
    tab: str = Query("Trending", enum=["Trending", "Newest", "ForYou"]),
    main: Optional[str] = Query(None),
    subs: Optional[str] = Query(None),
):
    """
    Return a list of posts filtered by tab, main genre, and sub genres.
    """
    try:
        # Convert comma-separated subs into a list if provided
        subs_list = subs.split(",") if subs else []
        posts = filter_posts_from_db(tab=tab, main=main or "", subs=subs_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"posts": posts}

# Endpoint to get all posts
@router.get("/", dependencies=[Depends(RateLimiter(times=40, seconds=60))])
async def get_all_posts():
    posts = get_all_posts_from_db()
    return {"posts": posts}
