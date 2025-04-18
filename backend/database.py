import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from datetime import datetime
import uuid
from typing import Optional, List
import logging
from backend.utils.security import hash_password
from pydantic import HttpUrl

# DynamoDB setup
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
users_table = dynamodb.Table('Users')
posts_table = dynamodb.Table('Posts')

logging.basicConfig(level=logging.DEBUG)

# Helper function to serialize custom types like HttpUrl and nested dictionaries
def serialize_item(item: dict) -> dict:
    for key, value in item.items():
        if isinstance(value, HttpUrl):
            item[key] = str(value)  # Convert HttpUrl to string
        elif isinstance(value, dict):
            item[key] = serialize_item(value)  # Recursively handle nested dictionaries
        elif isinstance(value, list):
            item[key] = [serialize_item(i) if isinstance(i, dict) else i for i in value]  # Handle lists of dicts
    return item

def save_to_dynamodb(item: dict, table_name: str):
    table = dynamodb.Table(table_name)
    try:
        response = table.put_item(Item=item)
        logging.debug(f"Saved item to {table_name}: {item}")
        logging.debug(f"Database response: {response}")  # Log the response
        return response
    except ClientError as e:
        logging.error(f"Error saving to {table_name}: {e}")
        return None

# --- User Management ---

def create_user_in_db(user_data: dict) -> Optional[str]:
    user_id = str(uuid.uuid4())
    item = {
        "user_id": user_id,
        "username": user_data["username"],
        "email": user_data["email"],
        "password": hash_password(user_data["password"]),
        "is_verified": user_data.get("is_verified", False),
        "created_at": str(datetime.utcnow())
    }
    try:
        response = users_table.put_item(Item=item)
        logging.debug(f"Created user: {item}")
        logging.debug(f"Database response: {response}")  # Log the response
        return user_id
    except ClientError as e:
        logging.error(f"User creation failed: {e}")
        return None

def get_user_from_db(user_id: str) -> Optional[dict]:
    try:
        response = users_table.get_item(Key={'user_id': user_id})
        logging.debug(f"Get user response: {response}")  # Log the response
        return response.get('Item')
    except ClientError as e:
        logging.error(f"Get user failed: {e}")
        return None

def get_user_by_email(email: str) -> Optional[dict]:
    try:
        response = users_table.get_item(Key={'email': email})
        logging.debug(f"Get user by email response: {response}")  # Log the response
        return response.get('Item')
    except ClientError as e:
        logging.error(f"Get user by email failed: {e}")
        return None

def get_user_by_username(username: str) -> Optional[dict]:
    try:
        response = users_table.scan(FilterExpression=Attr('username').eq(username))
        logging.debug(f"Get user by username response: {response}")  # Log the response
        items = response.get('Items', [])
        return items[0] if items else None
    except ClientError as e:
        logging.error(f"Get user by username failed: {e}")
        return None

def update_user_verification(email: str, is_verified: bool) -> bool:
    try:
        response = users_table.update_item(
            Key={'email': email},
            UpdateExpression="SET is_verified = :v",
            ExpressionAttributeValues={':v': is_verified}
        )
        logging.debug(f"Update verification response: {response}")  # Log the response
        return True
    except ClientError as e:
        logging.error(f"Verification update failed: {e}")
        return False

def update_reset_token(email: str, reset_token: str) -> bool:
    try:
        response = users_table.update_item(
            Key={'email': email},
            UpdateExpression="SET reset_token = :t",
            ExpressionAttributeValues={":t": reset_token}
        )
        logging.debug(f"Update reset token response: {response}")  # Log the response
        return True
    except ClientError as e:
        logging.error(f"Reset token update failed: {e}")
        return False

def update_user_password_by_email(email: str, new_password: str) -> bool:
    try:
        hashed = hash_password(new_password)
        response = users_table.update_item(
            Key={'email': email},
            UpdateExpression="SET password = :p, reset_token = :empty",
            ExpressionAttributeValues={":p": hashed, ":empty": ""}
        )
        logging.debug(f"Password update response: {response}")  # Log the response
        return True
    except ClientError as e:
        logging.error(f"Password update failed: {e}")
        return False

def update_user_profile(email: str, profile_data: dict) -> bool:
    try:
        update_expression = "SET " + ", ".join([f"{key} = :{key}" for key in profile_data])
        values = {f":{key}": value for key, value in profile_data.items()}
        response = users_table.update_item(
            Key={'email': email},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=values
        )
        logging.debug(f"Profile updated for {email} with {profile_data}")
        logging.debug(f"Profile update response: {response}")  # Log the response
        return True
    except ClientError as e:
        logging.error(f"Profile update failed: {e}")
        return False

# --- Post Management ---

def create_post_in_db(post_data: dict, user_id: str) -> Optional[str]:
    post_id = str(uuid.uuid4())
    post_data.update({
        'post_id': post_id,
        'user_id': user_id,
        'created_at': str(datetime.utcnow())
    })

    # Serialize the post data before saving to DynamoDB
    serialized_post_data = serialize_item(post_data)

    logging.debug(f"Attempting to save post to DB. Data: {serialized_post_data}")

    try:
        response = posts_table.put_item(Item=serialized_post_data)
        logging.debug(f"Post saved successfully. Response: {response}")
        return post_id
    except ClientError as e:
        logging.error(f"[ClientError] Failed to create post in DB: {e.response['Error']['Message']}")
    except Exception as e:
        logging.exception(f"[Exception] Unexpected error while saving post: {e}")
    return None

def get_post_from_db(post_id: str) -> Optional[dict]:
    try:
        response = posts_table.get_item(Key={'post_id': post_id})
        logging.debug(f"Get post response: {response}")  # Log the response
        return response.get('Item')
    except ClientError as e:
        logging.error(f"Get post failed: {e}")
        return None

def get_posts_by_user(user_id: str) -> List[dict]:
    try:
        response = posts_table.query(
            IndexName="user_id-index",
            KeyConditionExpression=Key('user_id').eq(user_id)
        )
        logging.debug(f"Get posts by user response: {response}")  # Log the response
        return response.get('Items', [])
    except ClientError as e:
        logging.error(f"Get posts by user failed: {e}")
        return []

def get_all_posts_from_db() -> List[dict]:
    try:
        response = posts_table.scan()
        logging.debug("Scanned posts table successfully.")
        logging.debug(f"Scan posts table response: {response}")  # Log the response
        return response.get('Items', [])
    except ClientError as e:
        logging.error(f"Error scanning posts table: {e}")
        return []

def filter_posts_from_db(tab: str, main: str, subs: list) -> List[dict]:
    try:
        filter_expr = None
        if main and main.lower() != "null":
            filter_expr = Attr('tags').contains(main)
        if subs:
            sub_filter = None
            for sub in subs:
                if sub_filter:
                    sub_filter = sub_filter | Attr('tags').contains(sub)
                else:
                    sub_filter = Attr('tags').contains(sub)
            filter_expr = filter_expr & sub_filter if filter_expr else sub_filter
        response = posts_table.scan(FilterExpression=filter_expr) if filter_expr else posts_table.scan()
        logging.debug("Filtered posts fetched successfully.")
        logging.debug(f"Filter posts response: {response}")  # Log the response
        return response.get('Items', [])
    except ClientError as e:
        logging.error(f"Error filtering posts: {e}")
        return []

# Helper function to serialize custom types like HttpUrl and nested dictionaries
def serialize_item(item: dict) -> dict:
    for key, value in item.items():
        if isinstance(value, HttpUrl):
            item[key] = str(value)  # Convert HttpUrl to string
        elif isinstance(value, dict):
            item[key] = serialize_item(value)  # Recursively handle nested dictionaries
        elif isinstance(value, list):
            item[key] = [serialize_item(i) if isinstance(i, dict) else i for i in value]  # Handle lists of dicts
    return item
