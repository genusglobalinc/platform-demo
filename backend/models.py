""" from pydantic import BaseModel
from typing import Optional, List

class User(BaseModel):
    id: str
    username: str
    email: str
    hashed_password: str
    is_developer: bool
    steam_profile: Optional[str] = None
    platform: Optional[str] = None

class Post(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    created_at: str
    test_event_id: Optional[str] = None

class TestEvent(BaseModel):
    id: str
    post_id: str
    participants: List[str]
"""

from pydantic import BaseModel, EmailStr

class User(BaseModel):
    id: str
    username: str
    email: EmailStr

class Post(BaseModel):
    id: str
    title: str
    content: str
