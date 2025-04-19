import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from datetime import datetime
import uuid
from typing import Optional, List
import logging
from backend.utils.security import hash_password
from fastapi.encoders import jsonable_encoder  # <-- Added this
from typing import Optional, Dict  # Ensure Dict is imported from typing

# DynamoDB setup
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
users_table = dynamodb.Table('Users')
posts_table = dynamodb.Table('Posts')

logging.basicConfig(level=logging.DEBUG)

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
        "display_name": user_data.get("display_name", ""),
        "social_links": user_data.get("social_links", ""),
        "profile_picture": user_data.get("profile_picture", ""),
        "followers": 0,
        "following": 0,
        "liked_posts": [],
        "is_verified": user_data.get("is_verified", False),
        "created_at": str(datetime.utcnow())
    }
    try:
        response = users_table.put_item(Item=item)
        logging.debug(f"Created user: {item}")
        logging.debug(f"Database response: {response}")
        return user_id
    except ClientError as e:
        logging.error(f"User creation failed: {e}")
        return None

def get_user_from_db(user_id: str) -> Optional[Dict[str, str]]:
    try:
        # Attempt to get the item from DynamoDB by user_id
        response = users_table.get_item(Key={'user_id': user_id})
        
        # Log the full response to check for successful retrieval
        logging.debug(f"Get user response: {response}")

        # Check if 'Item' exists in the response; if not, return None
        user_item = response.get('Item')
        
        if not user_item:
            logging.warning(f"User with user_id {user_id} not found in database.")
            return None
        
        # Return the user data (item) retrieved from DynamoDB
        return user_item

    except ClientError as e:
        # Log any ClientError raised by DynamoDB and return None
        logging.error(f"Get user failed for user_id {user_id}: {e}")
        return None

    except Exception as e:
        # Catch any other exceptions and log the error
        logging.error(f"Unexpected error occurred while fetching user {user_id}: {e}")
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

def update_user_profile(user_id: str, profile_data: dict) -> bool:
    """
    Update arbitrary profile fields for the given user_id.
    """
    try:
        # Build DynamoDB UpdateExpression, e.g. "SET display_name = :display_name, social_links = :social_links"
        update_expression = "SET " + ", ".join(f"{k} = :{k}" for k in profile_data.keys())
        expression_values = {f":{k}": v for k, v in profile_data.items()}

        response = users_table.update_item(
            Key={'user_id': user_id},                     # <-- use user_id as the primary key
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        logging.debug(f"Profile updated for user_id {user_id}: {profile_data}")
        logging.debug(f"DynamoDB response: {response}")
        return True

    except ClientError as e:
        logging.error(f"Profile update failed: {e}")
        return False

# --- Post Management ---

def create_post_in_db(post_data: dict, user_id: str) -> Optional[str]:
    post_id = str(uuid.uuid4())

    # Validation: Ensure title and description are present
    if 'title' not in post_data or 'description' not in post_data:
        logging.error("Title and description are mandatory fields.")
        return None

    # Normalize key if 'type' is used instead of 'post_type'
    if 'post_type' not in post_data and 'type' in post_data:
        post_data['post_type'] = post_data.pop('type')

    # Validation: Ensure post_type is either 'gaming' or 'anime'
    if post_data.get('post_type') not in ['gaming', 'anime']:
        logging.error("Invalid post_type. Must be 'gaming' or 'anime'.")
        return None

    post_data.update({
        'post_id': post_id,
        'user_id': user_id,
        'created_at': str(datetime.utcnow())
    })

    logging.debug(f"Attempting to save post to DB. Data: {post_data}")

    try:
        serialized_data = jsonable_encoder(post_data)  # <-- Use encoder here
        response = posts_table.put_item(Item=serialized_data)
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

def get_all_posts_from_db(post_type: Optional[str] = None, tags: Optional[List[str]] = None) -> List[dict]:
    try:
        response = posts_table.scan()
        logging.debug("Scanned posts table successfully.")
        logging.debug(f"Scan posts table response: {response}")
        all_items = response.get('Items', [])
        
        # Filter out posts without required fields
        filtered_items = [item for item in all_items if 'title' in item and 'description' in item]

        # Filter by post_type if provided
        if post_type:
            filtered_items = [item for item in filtered_items if item.get('post_type') == post_type]

        # Double filter: If tags are provided, filter posts with any of the tags in the provided list
        if tags:
            filtered_items = [
                item for item in filtered_items
                if 'tags' in item and any(tag in item['tags'] for tag in tags)
            ]

        return filtered_items

    except ClientError as e:
        logging.error(f"Error scanning posts table: {e}")
        return []

def filter_posts_from_db(tab: str, main: str, subs: list) -> List[dict]:
    try:
        filter_expr = None
        # Handle genre filtering (post_type)
        if main and main.lower() != "null":
            filter_expr = Attr('post_type').eq(main.lower())  # Ensure post_type is considered

        # Handle tags filtering (tags)
        if subs:
            sub_filter = None
            for sub in subs:
                if sub_filter:
                    sub_filter = sub_filter | Attr('tags').contains(sub)
                else:
                    sub_filter = Attr('tags').contains(sub)

            # Combine genre and tag filters if both exist
            filter_expr = filter_expr & sub_filter if filter_expr else sub_filter

        # Fetch posts based on combined filter expression
        response = posts_table.scan(FilterExpression=filter_expr) if filter_expr else posts_table.scan()
        logging.debug("Filtered posts fetched successfully.")
        logging.debug(f"Filter posts response: {response}")  # Log the response
        return response.get('Items', [])
    except ClientError as e:
        logging.error(f"Error filtering posts: {e}")
        return []

def update_user_password(user_id: str, new_password: str) -> bool:
    try:
        hashed = hash_password(new_password)
        response = users_table.update_item(
            Key={'user_id': user_id},
            UpdateExpression="SET password = :p",
            ExpressionAttributeValues={":p": hashed}
        )
        logging.debug(f"Password updated for user: {user_id}")
        logging.debug(f"Password update response: {response}")  # Log the response
        return True
    except ClientError as e:
        logging.error(f"Password update failed for user {user_id}: {e}")
        return False
