import boto3
from boto3.dynamodb.conditions import Key
import uuid
from botocore.exceptions import ClientError

# Set up DynamoDB client
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')
posts_table = dynamodb.Table('Posts')
events_table = dynamodb.Table('Events')

# Function to save data to DynamoDB (generic for different tables)
def save_to_dynamodb(item, table_name):
    table = dynamodb.Table(table_name)
    try:
        response = table.put_item(Item=item)
        return response
    except ClientError as e:
        print(f"Error saving to DynamoDB: {e}")
        return None

# Fetch user from the database using the user_id
def get_user_from_db(user_id: str):
    try:
        response = users_table.get_item(Key={'user_id': user_id})
        return response.get('Item')
    except ClientError as e:
        print(f"Error fetching user from DynamoDB: {e}")
        return None

# Fetch post from the database using the post_id
def get_post_from_db(post_id: str):
    try:
        response = posts_table.get_item(Key={'post_id': post_id})
        return response.get('Item')
    except ClientError as e:
        print(f"Error fetching post from DynamoDB: {e}")
        return None

# Create a new post in the database
def create_post_in_db(post_data: dict, user_id: str):
    post_id = str(uuid.uuid4())  # Generate a new post_id
    post_data['post_id'] = post_id
    post_data['user_id'] = user_id
    try:
        posts_table.put_item(Item=post_data)
        return post_id
    except ClientError as e:
        print(f"Error creating post in DynamoDB: {e}")
        return None

# Fetch event from the database using the event_id
def get_event_from_db(event_id: str):
    try:
        response = events_table.get_item(Key={'event_id': event_id})
        return response.get('Item')
    except ClientError as e:
        print(f"Error fetching event from DynamoDB: {e}")
        return None

# Register a user for an event
def register_user_for_event(user_id: str, post_id: str):
    registration_id = str(uuid.uuid4())  # Generate a new registration ID
    try:
        events_table.update_item(
            Key={'event_id': post_id},
            UpdateExpression="SET registered_users = list_append(registered_users, :val)",
            ExpressionAttributeValues={":val": [user_id]}
        )
        return registration_id
    except ClientError as e:
        print(f"Error registering user for event in DynamoDB: {e}")
        return None

# Fetch posts for a given user
def get_posts_by_user(user_id: str):
    try:
        response = posts_table.query(
            IndexName="user_id-index",  # Assuming there's a GSI with user_id as the partition key
            KeyConditionExpression=Key('user_id').eq(user_id)
        )
        return response.get('Items', [])
    except ClientError as e:
        print(f"Error fetching posts by user: {e}")
        return []

# Fetch events related to a post
def get_events_for_post(post_id: str):
    try:
        response = events_table.query(
            IndexName="post_id-index",  # Assuming there's a GSI with post_id as the partition key
            KeyConditionExpression=Key('post_id').eq(post_id)
        )
        return response.get('Items', [])
    except ClientError as e:
        print(f"Error fetching events for post: {e}")
        return []

