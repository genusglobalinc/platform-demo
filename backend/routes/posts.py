from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.database import get_post_from_db, create_post_in_db
from backend.utils.security import verify_access_token
from typing import List, Union
from pydantic import HttpUrl

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
    post_data: Union[GamingPost, AnimePost]  # The actual post data (either gaming or anime data)

# Endpoint to create a post (protected)
@router.post("/", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def create_post(post_data: PostCreateRequest, token: dict = Depends(verify_access_token)):
    user_id = token.get("sub")

    # Handle Gaming Post
    if post_data.genre == "gaming":
        gaming_post_data = post_data.post_data  # This is an instance of GamingPost
        post_id = create_post_in_db(gaming_post_data.dict(), user_id)
    
    # Handle Anime Post
    elif post_data.genre == "anime":
        anime_post_data = post_data.post_data  # This is an instance of AnimePost
        post_id = create_post_in_db(anime_post_data.dict(), user_id)
    
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

