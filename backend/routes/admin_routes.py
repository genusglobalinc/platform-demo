from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from pydantic import BaseModel
import os
from ..utils.security import get_current_user, get_admin_user
from ..database import get_user_collection, get_user_by_id
from ..config import get_settings

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

@router.get("/users", response_model=List[Dict[str, Any]])
async def get_users(current_user: dict = Depends(get_admin_user)):
    """Get all users with their demographic information. Only accessible by admin users."""
    users_collection = get_user_collection()
    users = []
    
    async for user in users_collection.find({}):
        # Convert ObjectId to string for JSON serialization
        user["_id"] = str(user["_id"])
        users.append(user)
    
    return users

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
