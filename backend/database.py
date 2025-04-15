import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from datetime import datetime
import uuid
import logging
from backend.utils.security import hash_password

# DynamoDB setup
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
users_table = dynamodb.Table('Users')
posts_table = dynamodb.Table('Posts')
events_table = dynamodb.Table('Events')

logging.basicConfig(level=logging.DEBUG)

def save_to_dynamodb(item, table_name):
    table = dynamodb.Table(table_name)
    try:
        response = table.put_item(Item=item)
        logging.debug(f"Saved item to {table_name}: {item}")
        return response
    except ClientError as e:
        logging.error(f"Error saving to {table_name}: {e}")
        return None

def create_user_in_db(user_data: dict):
    # Check if username already exists using the GSI
    existing_user = get_user_by_username(user_data["username"])
    if existing_user:
        logging.warning(f"Username '{user_data['username']}' is already taken.")
        return None  # Or return an error message indicating username conflict

    # Proceed to create the user if username is available 
    user_id = str(uuid.uuid4())
    item = {
        "user_id": user_id,
        "username": user_data["username"],
        "email": user_data["email"],
        "password": user_data["password"],
        "is_verified": user_data.get("is_verified", False),
        "created_at": str(datetime.utcnow())
    }
    try:
        users_table.put_item(Item=item)
        logging.debug(f"Created user: {item}")
        return user_id
    except ClientError as e:
        logging.error(f"User creation failed: {e}")
        return None

def get_user_from_db(user_id: str):
    try:
        response = users_table.get_item(Key={'user_id': user_id})
        return response.get('Item')
    except ClientError as e:
        logging.error(f"Get user failed: {e}")
        return None

def get_user_by_email(email: str):
    try:
        response = users_table.get_item(Key={'email': email})
        return response.get('Item')
    except ClientError as e:
        logging.error(f"Get user by email failed: {e}")
        return None

def get_user_by_username(username: str):
    try:
        response = users_table.query(
            IndexName='username-index',  # Use the GSI
            KeyConditionExpression=Key('username').eq(username)
        )
        items = response.get('Items', [])
        return items[0] if items else None
    except ClientError as e:
        logging.error(f"Get user by username failed: {e}")
        return None

def update_user_verification(email: str, is_verified: bool):
    try:
        users_table.update_item(
            Key={'email': email},
            UpdateExpression="SET is_verified = :v",
            ExpressionAttributeValues={':v': is_verified}
        )
        return True
    except ClientError as e:
        logging.error(f"Verification update failed: {e}")
        return False

def update_reset_token(email: str, reset_token: str):
    try:
        users_table.update_item(
            Key={'email': email},
            UpdateExpression="SET reset_token = :t",
            ExpressionAttributeValues={":t": reset_token}
        )
        return True
    except ClientError as e:
        logging.error(f"Reset token update failed: {e}")
        return False

def update_user_password_by_email(email: str, new_password: str):
    try:
        hashed = hash_password(new_password)
        users_table.update_item(
            Key={'email': email},
            UpdateExpression="SET password = :p, reset_token = :empty",
            ExpressionAttributeValues={":p": hashed, ":empty": ""}
        )
        return True
    except ClientError as e:
        logging.error(f"Password update failed: {e}")
        return False

def update_user_profile(email: str, profile_data: dict):
    try:
        update_expression = "SET " + ", ".join([f"{key} = :{key}" for key in profile_data])
        values = {f":{key}": value for key, value in profile_data.items()}
        users_table.update_item(
            Key={'email': email},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=values
        )
        return True
    except ClientError as e:
        logging.error(f"Profile update failed: {e}")
        return False

def create_post_in_db(post_data: dict, user_id: str):
    post_id = str(uuid.uuid4())
    post_data.update({
        'post_id': post_id,
        'user_id': user_id
    })
    try:
        posts_table.put_item(Item=post_data)
        return post_id
    except ClientError as e:
        logging.error(f"Create post failed: {e}")
        return None

def get_post_from_db(post_id: str):
    try:
        response = posts_table.get_item(Key={'post_id': post_id})
        return response.get('Item')
    except ClientError as e:
        logging.error(f"Get post failed: {e}")
        return None

def get_posts_by_user(user_id: str):
    try:
        response = posts_table.query(
            IndexName="user_id-index",
            KeyConditionExpression=Key('user_id').eq(user_id)
        )
        return response.get('Items', [])
    except ClientError as e:
        logging.error(f"Get posts by user failed: {e}")
        return []

def get_event_from_db(event_id: str):
    try:
        response = events_table.get_item(Key={'event_id': event_id})
        return response.get('Item')
    except ClientError as e:
        logging.error(f"Get event failed: {e}")
        return None

def register_user_for_event(user_id: str, post_id: str):
    try:
        events_table.update_item(
            Key={'event_id': post_id},
            UpdateExpression="SET registered_users = list_append(if_not_exists(registered_users, :empty_list), :val)",
            ExpressionAttributeValues={
                ":val": [user_id],
                ":empty_list": []
            }
        )
        return True
    except ClientError as e:
        logging.error(f"Register for event failed: {e}")
        return False

def update_user_password(user_id: str, new_password: str):
    try:
        hashed = hash_password(new_password)
        users_table.update_item(
            Key={'user_id': user_id},
            UpdateExpression="SET password = :p",
            ExpressionAttributeValues={":p": hashed}
        )
        logging.debug(f"Password updated for user: {user_id}")
        return True
    except ClientError as e:
        logging.error(f"Password update failed for user {user_id}: {e}")
        return False

def filter_posts_from_db(tab: str = "Trending", main: str = None, subs: str = None):
    # Replace this mock data with a real DB query
    mock_posts = [
        {
            "id": "1",
            "title": "Anime Battle Royale",
            "tags": ["Anime", "Action"],
            "image_url": "/static/images/anime.jpg",
            "video_url": "/static/videos/anime.mp4",
            "likes": 120
        },
        {
            "id": "2",
            "title": "FPS Mayhem",
            "tags": ["Gaming", "First Person Shooter"],
            "image_url": "/static/images/fps.jpg",
            "video_url": "/static/videos/fps.mp4",
            "likes": 200
        }
    ]

    # Filter by main tag
    if main:
        mock_posts = [post for post in mock_posts if main in post["tags"]]

    # Filter by sub tag
    if subs:
        mock_posts = [post for post in mock_posts if subs in post["tags"]]

    # Sort based on tab logic
    if tab == "Trending":
        mock_posts = sorted(mock_posts, key=lambda x: x["likes"], reverse=True)
    elif tab == "Newest":
        mock_posts = list(reversed(mock_posts))  # Fake newest
    elif tab == "ForYou":
        # For now just return all
        pass

    return mock_posts
