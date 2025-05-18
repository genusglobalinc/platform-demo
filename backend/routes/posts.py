from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, HttpUrl
from typing import List, Union, Optional, Any, Dict
import json
import uuid, logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib

from backend.database import (
    get_post_from_db,
    create_post_in_db,
    get_all_posts_from_db,
    filter_posts_from_db,
    delete_post_in_db,
    posts_table,
    _sanity_client,
    get_user_from_db,
)
from backend.utils.security import verify_access_token
from fastapi_limiter.depends import RateLimiter
from backend.config import get_settings

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
    is_approved: bool = False  # Add is_approved field to GamingPost schema

class PostCreateRequest(BaseModel):
    genre: str  # Must be "gaming" (legacy anime removed)
    post_data: GamingPost

# ---------- Registration Schemas ----------

class RegistrationRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

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

    # Posts need admin approval before visible
    post_data.post_data.is_approved = False  # mark as pending approval

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

# ----------------- Registration -----------------

@router.post("/{post_id}/register")
async def register_for_post(
    post_id: str,
    reg: RegistrationRequest,
    token: str = Depends(oauth2_scheme),
):
    payload = verify_access_token(token)
    user_id = payload.get("sub")
    user_type = payload.get("user_type")
    if user_type != "Tester":
        raise HTTPException(status_code=403, detail="Only Tester accounts can register for events")

    post = get_post_from_db(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Prevent duplicate registration (same user id already in list)
    existing_regs = post.get("registrants", [])
    if any(r.get("user_id") == user_id for r in existing_regs):
        raise HTTPException(status_code=400, detail="You have already registered for this event")

    registrant = {
        "_key": str(uuid.uuid4()),
        "user_id": user_id,
        "name": reg.name or payload.get("display_name") or payload.get("username"),
        "email": reg.email or payload.get("email"),
        "registered_at": datetime.utcnow().isoformat(),
    }

    if _sanity_client:
        try:
            current_regs = post.get("registrants", [])
            new_regs = current_regs + [registrant]
            _sanity_client.patch_document(post_id, {"registrants": new_regs})
        except Exception as e:
            logging.error(f"[register_for_post] Sanity patch failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to register for event")
    else:
        try:
            posts_table.update_item(
                Key={"post_id": post_id},
                UpdateExpression="SET registrants = list_append(if_not_exists(registrants, :empty), :r)",
                ConditionExpression="attribute_not_exists(registrants) OR NOT contains(registrants[0].user_id, :uid)",
                ExpressionAttributeValues={":r": [registrant], ":empty": [], ":uid": user_id},
                ExpressionAttributeNames={"#reg": "registrants"},
            )
        except Exception as e:
            logging.error(f"[register_for_post] Dynamo update failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to register for event")

    return {"message": "Successfully registered"}

# ----------------- Email Registrants -----------------

@router.post("/{post_id}/email-registrants")
async def email_registrants(
    post_id: str,
    token: str = Depends(oauth2_scheme),
):
    payload = verify_access_token(token)
    current_user_id = payload.get("sub")
    user_type = payload.get("user_type")

    post = get_post_from_db(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    owner_id = post.get("testerId") or post.get("user_id")

    # Only the owner Dev or an Admin may request
    if current_user_id != owner_id and user_type != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to email registrants")

    owner_user = get_user_from_db(owner_id)
    if not owner_user:
        raise HTTPException(status_code=404, detail="Developer account not found")

    recipient_email = owner_user.get("email")
    if not recipient_email:
        raise HTTPException(status_code=400, detail="Developer email missing")

    if not owner_user.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Developer email not verified")

    registrants = post.get("registrants", [])
    if not registrants:
        raise HTTPException(status_code=400, detail="No registrants to email")

    settings = get_settings()
    msg = MIMEMultipart()
    msg["Subject"] = f"Registrants for {post.get('title')}"
    msg["From"] = settings.email_sender
    msg["To"] = recipient_email

    html = "<html><body>"
    html += f"<h2>Registrants ({len(registrants)})</h2><ul>"
    for r in registrants:
        html += f"<li>{r.get('name')} ({r.get('email')}) at {r.get('registered_at')}</li>"
    html += "</ul></body></html>"

    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as server:
            if settings.smtp_use_tls:
                server.starttls()
            # Login only if credentials provided
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
    except Exception as e:
        logging.error(f"[email_registrants] SMTP error: {e}")
        raise HTTPException(status_code=500, detail="Email sending failed")

    return {"success": True, "recipient": recipient_email}
