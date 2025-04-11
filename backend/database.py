import boto3
from boto3.dynamodb.conditions import Key
import uuid
from botocore.exceptions import ClientError
import logging

# Set up DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
users_table = dynamodb.Table('Users')
posts_table = dynamodb.Table('Posts')
events_table = dynamodb.Table('Events')

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Function to save data to DynamoDB (generic for different tables)
def save_to_dynamodb(item, table_name):
    table = dynamodb.Table(table_name)
    try:
        logging.debug(f"Saving item: {item} to table: {table_name}")
        response = table.put_item(Item=item)
        logging.debug(f"Response from DynamoDB: {response}")
        return response
    except ClientError as e:
        logging.error(f"Error saving to DynamoDB: {e}")
        return None

# Fetch user from the database using the user_id
def get_user_from_db(user_id: str):
    try:
        logging.debug(f"Fetching user with user_id: {user_id}")
        response = users_table.get_item(Key={'user_id': user_id})
        user = response.get('Item', None)
        if not user:
            logging.warning(f"User not found: {user_id}")
        return user
    except ClientError as e:
        logging.error(f"Error fetching user from DynamoDB: {e}")
        return None

# Fetch post from the database using the post_id
def get_post_from_db(post_id: str):
    try:
        logging.debug(f"Fetching post with post_id: {post_id}")
        response = posts_table.get_item(Key={'post_id': post_id})
        post = response.get('Item', None)
        if not post:
            logging.warning(f"Post not found: {post_id}")
        return post
    except ClientError as e:
        logging.error(f"Error fetching post from DynamoDB: {e}")
        return None

# Create a new post in the database
def create_post_in_db(post_data: dict, user_id: str):
    post_id = str(uuid.uuid4())  # Generate a new post_id
    post_data['post_id'] = post_id
    post_data['user_id'] = user_id
    try:
        logging.debug(f"Creating post for user_id: {user_id}, data: {post_data}")
        posts_table.put_item(Item=post_data)
        logging.debug(f"Post created with post_id: {post_id}")
        return post_id
    except ClientError as e:
        logging.error(f"Error creating post in DynamoDB: {e}")
        return None

# Fetch event from the database using the event_id
def get_event_from_db(event_id: str):
    try:
        logging.debug(f"Fetching event with event_id: {event_id}")
        response = events_table.get_item(Key={'event_id': event_id})
        event = response.get('Item', None)
        if not event:
            logging.warning(f"Event not found: {event_id}")
        return event
    except ClientError as e:
        logging.error(f"Error fetching event from DynamoDB: {e}")
        return None

# Register a user for an event
def register_user_for_event(user_id: str, post_id: str):
    registration_id = str(uuid.uuid4())  # Generate a new registration ID
    try:
        logging.debug(f"Registering user {user_id} for event with post_id: {post_id}")
        events_table.update_item(
            Key={'event_id': post_id},
            UpdateExpression="SET registered_users = list_append(registered_users, :val)",
            ExpressionAttributeValues={":val": [user_id]}
        )
        logging.debug(f"User {user_id} successfully registered for event {post_id}")
        return registration_id
    except ClientError as e:
        logging.error(f"Error registering user for event in DynamoDB: {e}")
        return None

# Fetch posts for a given user
def get_posts_by_user(user_id: str):
    try:
        logging.debug(f"Fetching posts for user_id: {user_id}")
        response = posts_table.query(
            IndexName="user_id-index",  # Assuming there's a GSI with user_id as the partition key
            KeyConditionExpression=Key('user_id').eq(user_id)
        )
        posts = response.get('Items', [])
        if not posts:
            logging.warning(f"No posts found for user: {user_id}")
        return posts
    except ClientError as e:
        logging.error(f"Error fetching posts by user: {e}")
        return []

def get_user_by_username(username: str):
    try:
        response = users_table.scan(
            FilterExpression=Key('username').eq(username)
        )
        items = response.get('Items', [])
        return items[0] if items else None
    except ClientError as e:
        print(f"[DB] Error fetching by username: {e}")
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
        print(f"[DB] Error updating verification status: {e}")
        return False