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
