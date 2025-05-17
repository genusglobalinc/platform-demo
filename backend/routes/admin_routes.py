from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from pydantic import BaseModel
import os
from ..utils.security import get_current_user, get_admin_user
from ..database import (get_user_collection, get_user_by_id, get_post_from_db,
                        update_user_profile, get_pending_posts_from_db)
from ..config import get_settings
from ..notifications import send_notification

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    responses={404: {"description": "Not found"}},
)

class EmailRequest(BaseModel):
    user_id: str

class EmailResponse(BaseModel):
    success: bool
    recipient: str

class EmailBatchRequest(BaseModel):
    user_ids: List[str]

class PostApprovalRequest(BaseModel):
    post_id: str
    approve: bool = True  # False means reject (delete)

@router.get("/users", response_model=Dict[str, Any])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_admin_user),
):
    """Get users with pagination. Only accessible by admin users.

    Returns a dict with total user count and the list of users for the requested page.
    """
    users_collection = get_user_collection()

    total = await users_collection.count_documents({})

    cursor = users_collection.find({}).skip(skip).limit(limit)
    users: List[Dict[str, Any]] = []
    async for user in cursor:
        user["_id"] = str(user["_id"])
        users.append(user)

    return {"total": total, "users": users}

@router.post("/send-demographic-email", response_model=EmailResponse)
async def send_demographic_email(request: EmailRequest, current_user: dict = Depends(get_admin_user)):
    """Send demographic information via email. Only accessible by admin users."""
    # Get user data
    user = await get_user_by_id(request.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    settings = get_settings()
    
    # Check if the user has demographic information
    if "demographic_info" not in user or not user["demographic_info"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have demographic information"
        )
    
    # Prepare email content
    msg = MIMEMultipart()
    msg["Subject"] = f"Demographic Information for {user.get('display_name') or user.get('username')}"
    msg["From"] = settings.email_sender
    # Send to developers (in this implementation, we'll send to the admin's email)
    msg["To"] = current_user.get("email")
    
    # Create HTML content
    html_content = f"""
    <html>
        <body>
            <h2>Demographic Information for {user.get('display_name') or user.get('username')}</h2>
            <p><strong>User ID:</strong> {user.get('_id')}</p>
            <p><strong>Username:</strong> {user.get('username')}</p>
            <p><strong>Email:</strong> {user.get('email')}</p>
            <h3>Demographic Information</h3>
    """
    
    # Add demographic information
    demo_info = user.get("demographic_info", {})
    for key, value in demo_info.items():
        # Format key_name to be more readable (e.g., "preferred_platforms" -> "Preferred Platforms")
        formatted_key = key.replace("_", " ").title()
        html_content += f"<p><strong>{formatted_key}:</strong> {value}</p>\n"
    
    html_content += """
        </body>
    </html>
    """
    
    # Attach HTML content
    msg.attach(MIMEText(html_content, "html"))
    
    try:
        # Connect to SMTP server and send email
        with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as server:
            if settings.smtp_use_tls:
                server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
            
        return {"success": True, "recipient": current_user.get("email")}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )

# ---------------------- Send Demographics (Batch) ----------------------

@router.post("/send-demographic-email-batch", response_model=EmailResponse)
async def send_demographic_email_batch(
    request: EmailBatchRequest, current_user: dict = Depends(get_admin_user)
):
    """Send demographic information for multiple users in a single email."""

    if not request.user_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No user IDs provided")

    valid_users: List[Dict[str, Any]] = []
    for uid in request.user_ids:
        user = await get_user_by_id(uid)
        if user and user.get("demographic_info"):
            user["_id"] = str(user.get("_id"))
            valid_users.append(user)

    if not valid_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="None of the selected users have demographic information",
        )

    settings = get_settings()

    msg = MIMEMultipart()
    msg["Subject"] = f"Demographic Information for {len(valid_users)} Users"
    msg["From"] = settings.email_sender
    msg["To"] = current_user.get("email")

    html_content = "<html><body>"
    html_content += f"<h2>Demographic Information Report (Total: {len(valid_users)})</h2>"

    for user in valid_users:
        html_content += f"<h3>{user.get('display_name') or user.get('username')}</h3>"
        html_content += f"<p><strong>User ID:</strong> {user.get('_id')}</p>"
        html_content += f"<p><strong>Email:</strong> {user.get('email')}</p>"
        demo_info = user.get("demographic_info", {})
        for key, value in demo_info.items():
            formatted_key = key.replace("_", " ").title()
            html_content += f"<p><strong>{formatted_key}:</strong> {value}</p>"
        html_content += "<hr />"

    html_content += "</body></html>"

    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as server:
            if settings.smtp_use_tls:
                server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)

        return {"success": True, "recipient": current_user.get("email")}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}",
        )

# ------------------------------ Post Approval ------------------------------

@router.post("/approve-post", status_code=200)
async def approve_post(request: PostApprovalRequest, current_user: dict = Depends(get_admin_user)):
    """Approve or reject a pending post. When approved, set is_approved=True and notify poster.
    If reject is chosen, the post is deleted.
    """
    
    post = get_post_from_db(request.post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Only allow approving if currently not approved
    if request.approve:
        if post.get("is_approved"):
            return {"message": "Post already approved"}

        # Update in Sanity or Dynamo
        success = False
        if _sanity_client := getattr(post, "_sanity_client", None):
            try:
                _sanity_client.patch_document(request.post_id, {"is_approved": True})
                success = True
            except Exception as e:
                logging.error(f"[approve_post] Sanity patch failed: {e}")
        else:
            # DynamoDB update via user profile isn't appropriate; patch directly
            try:
                from boto3.dynamodb.conditions import Attr
                import boto3
                dynamodb = boto3.resource("dynamodb", region_name="us-east-2")
                posts_table = dynamodb.Table("Posts")
                posts_table.update_item(
                    Key={"post_id": request.post_id},
                    UpdateExpression="SET is_approved = :t",
                    ExpressionAttributeValues={":t": True},
                )
                success = True
            except Exception as e:
                logging.error(f"[approve_post] Dynamo patch failed: {e}")

        if not success:
            raise HTTPException(status_code=500, detail="Failed to approve post")

        # Send notification to tester and dev (if testerId field present)
        recipient_ids = [post.get("testerId"), post.get("user_id")]
        for rid in filter(None, recipient_ids):
            send_notification(
                rid,
                message="Your post has been approved by admin.",
                metadata={"post_id": request.post_id},
            )

        return {"message": "Post approved"}

    # -------------------- Reject/Delete --------------------
    from ..database import delete_post_in_db

    owner_id = post.get("testerId") or post.get("user_id")
    if not delete_post_in_db(request.post_id, owner_id):
        raise HTTPException(status_code=500, detail="Failed to delete post")

    if owner_id:
        send_notification(
            owner_id,
            message="Your post has been rejected and removed by admin.",
            metadata={"post_id": request.post_id},
        )

    return {"message": "Post rejected and deleted"}

# ------------------------------ Pending Posts ------------------------------

@router.get("/pending-posts", response_model=List[Dict[str, Any]])
async def list_pending_posts(current_user: dict = Depends(get_admin_user)):
    """Return all posts that are awaiting admin approval."""
    return get_pending_posts_from_db()
