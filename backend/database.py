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
        # Assuming 'email' is a primary key or you can use a GSI on 'email'
        response = users_table.get_item(Key={'email': email})
        return response.get('Item')
    except ClientError as e:
        logging.error(f"Get user by email failed: {e}")
        return None

def get_user_by_username(username: str):
    try:
        response = users_table.scan(FilterExpression=Attr('username').eq(username))
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
        logging.debug(f"Profile updated for {email} with {profile_data}")
        return True
    except ClientError as e:
        logging.error(f"Profile update failed: {e}")
        return False

def create_post_in_db(post_data: Union[GamingPost, AnimePost]):
    post_id = str(uuid.uuid4())  # Generate a unique post ID
    item = post_data.dict()  # Convert the post data into a dictionary
    item.update({
        'post_id': post_id,  # Add the generated post ID
        'created_at': str(datetime.utcnow()),  # Add the current timestamp
    })
    
    # Save the item to DynamoDB
    try:
        response = posts_table.put_item(Item=item)
        logging.debug(f"Created post: {item}")
        return post_id  # Return the post ID after saving it
    except ClientError as e:
        logging.error(f"Create post failed: {e}")
        return None  # Return None if there was an error

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

# New function: Get all posts (scan the table)
def get_all_posts_from_db():
    try:
        response = posts_table.scan()
        logging.debug("Scanned posts table successfully.")
        return response.get('Items', [])
    except ClientError as e:
        logging.error(f"Error scanning posts table: {e}")
        return []

# New function: Filter posts based on parameters (e.g., main genre, subtypes)
def filter_posts_from_db(tab: str, main: str, subs: list):
    try:
        filter_expr = None
        
        # For main genre filtering (assuming posts have a 'tags' attribute)
        if main and main.lower() != "null":
            filter_expr = Attr('tags').contains(main)
        
        # Add subtypes filtering if provided
        if subs and len(subs) > 0:
            sub_filter = None
            for sub in subs:
                if sub_filter:
                    sub_filter = sub_filter | Attr('tags').contains(sub)
                else:
                    sub_filter = Attr('tags').contains(sub)
            if filter_expr:
                filter_expr = filter_expr & sub_filter
            else:
                filter_expr = sub_filter
        
        if filter_expr:
            response = posts_table.scan(FilterExpression=filter_expr)
        else:
            response = posts_table.scan()
        
        logging.debug("Filtered posts fetched successfully.")
        return response.get('Items', [])
    except ClientError as e:
        logging.error(f"Error filtering posts: {e}")
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
        logging.debug(f"User {user_id} registered for event {post_id} successfully.")
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
