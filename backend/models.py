from pydantic import BaseModel
from typing import List

class User(BaseModel):
    username: str
    email: str
    steam_id: str
    pc_console_info: dict

class Post(BaseModel):
    title: str
    description: str
    created_by: str
    test_event_ids: List[str]  # Links to events

class Event(BaseModel):
    event_name: str
    event_description: str
    scheduled_time: str
    participants: List[str]  # List of player IDs registered
