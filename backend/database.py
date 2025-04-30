import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from datetime import datetime
import uuid
from typing import Optional, List, Dict
import logging
from backend.utils.security import hash_password
from fastapi.encoders import jsonable_encoder  
from typing import Optional  
import pyotp  
from backend.sanity_client import SanityClient

# DynamoDB setup
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
users_table = dynamodb.Table('Users')
posts_table = dynamodb.Table('Posts')

logging.basicConfig(level=logging.DEBUG)

try:
    _sanity_client = SanityClient()
except Exception as e:
    _sanity_client = None
    logging.warning(f"Sanity client not initialized: {e}")

def save_to_dynamodb(item: dict, table_name: str):
    table = dynamodb.Table(table_name)
    try:
        response = table.put_item(Item=item)
        logging.debug(f"Saved item to {table_name}: {item}")
        logging.debug(f"Database response: {response}")  
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
        "created_at": str(datetime.utcnow()),
        "two_factor_secret": user_data.get("two_factor_secret"),
        "two_factor_enabled": user_data.get("two_factor_enabled", False)
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
        response = users_table.get_item(Key={'user_id': user_id})
        
        logging.debug(f"Get user response: {response}")

        user_item = response.get('Item')
        
        if not user_item:
            logging.warning(f"User with user_id {user_id} not found in database.")
            return None
        
        return user_item

    except ClientError as e:
        logging.error(f"Get user failed for user_id {user_id}: {e}")
        return None

    except Exception as e:
        logging.error(f"Unexpected error occurred while fetching user {user_id}: {e}")
        return None

def get_user_by_email(email: str) -> Optional[dict]:
    try:
        response = users_table.get_item(Key={'email': email})
        logging.debug(f"Get user by email response: {response}")  
        return response.get('Item')
    except ClientError as e:
        logging.error(f"Get user by email failed: {e}")
        return None

def get_user_by_username(username: str) -> Optional[dict]:
    try:
        response = users_table.scan(FilterExpression=Attr('username').eq(username))
        logging.debug(f"Get user by username response: {response}")  
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
        logging.debug(f"Update verification response: {response}")  
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
        logging.debug(f"Update reset token response: {response}")  
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
        logging.debug(f"Password update response: {response}")  
        return True
    except ClientError as e:
        logging.error(f"Password update failed: {e}")
        return False

def verify_2fa_code(user_id: str, code: str) -> bool:
    """Verify a 2FA code for a user."""
    try:
        user = get_user_from_db(user_id)
        if not user or not user.get('two_factor_secret'):
            return False
        
        totp = pyotp.TOTP(user['two_factor_secret'])
        return totp.verify(code)
    except Exception as e:
        logging.error(f"2FA verification failed: {e}")
        return False

def update_user_profile(user_id: str, profile_data: dict) -> bool:
    """
    Update arbitrary profile fields for the given user_id.
    """
    try:
        update_expression = "SET " + ", ".join(f"{k} = :{k}" for k in profile_data.keys())
        expression_values = {f":{k}": v for k, v in profile_data.items()}

        response = users_table.update_item(
            Key={'user_id': user_id},                     
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
    if _sanity_client:
        try:
            # Banner image
            banner_val = post_data.get("banner_image")
            banner_ref = None
            if banner_val:
                if isinstance(banner_val, dict) and banner_val.get("_type") == "image":
                    banner_ref = banner_val  # already uploaded
                else:
                    banner_ref = _sanity_client.upload_image_from_url(banner_val)

            # Gallery images
            image_refs = []
            for img in post_data.get("images", []):
                try:
                    if isinstance(img, dict) and img.get("_type") == "image":
                        image_refs.append(img)
                    else:
                        image_refs.append(_sanity_client.upload_image_from_url(img))
                except Exception as img_err:
                    logging.error(f"Failed to upload image {img}: {img_err}")

            sanity_payload = {
                "title": post_data.get("title"),
                "description": post_data.get("description"),
                "postType": post_data.get("post_type") or post_data.get("type"),
                "tags": post_data.get("tags", []),
                "studio": post_data.get("studio"),
                "bannerImage": banner_ref,
                "images": image_refs,
                "testerId": user_id,
                "status": "draft",
                "date": str(datetime.utcnow()),
            }

            return _sanity_client.create_document("post", sanity_payload)
        except Exception as e:
            logging.error(f"Sanity create post failed: {e}")
            return None
    else:
        post_id = str(uuid.uuid4())

        if 'title' not in post_data or 'description' not in post_data:
            logging.error("Title and description are mandatory fields.")
            return None

        if 'post_type' not in post_data and 'type' in post_data:
            post_data['post_type'] = post_data.pop('type')

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
            serialized_data = jsonable_encoder(post_data)  
            response = posts_table.put_item(Item=serialized_data)
            logging.debug(f"Post saved successfully. Response: {response}")
            return post_id
        except ClientError as e:
            logging.error(f"[ClientError] Failed to create post in DB: {e.response['Error']['Message']}")
        except Exception as e:
            logging.exception(f"[Exception] Unexpected error while saving post: {e}")
        return None

def get_post_from_db(post_id: str) -> Optional[dict]:
    if _sanity_client:
        try:
            return _sanity_client.get_document(post_id)
        except Exception as e:
            logging.error(f"Sanity get post failed: {e}")
            return None
    else:
        try:
            response = posts_table.get_item(Key={'post_id': post_id})
            logging.debug(f"Get post response: {response}")  
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
        logging.debug(f"Get posts by user response: {response}")  
        return response.get('Items', [])
    except ClientError as e:
        logging.error(f"Get posts by user failed: {e}")
        return []

def get_all_posts_from_db(post_type: Optional[str] = None, tags: Optional[List[str]] = None) -> List[dict]:
    if _sanity_client:
        try:
            base_query = '*[_type == "post"'
            conditions = []
            if post_type:
                conditions.append(f'postType == "{post_type}"')
            if tags:
                tag_cond = ' || '.join([f'"{t}" in tags' for t in tags])
                conditions.append(f'({tag_cond})')
            query = base_query + (' && ' + ' && '.join(conditions) if conditions else '') + ']'
            return _sanity_client.query_documents(query)
        except Exception as e:
            logging.error(f"Sanity get all posts failed: {e}")
            return []
    else:
        try:
            response = posts_table.scan()
            logging.debug("Scanned posts table successfully.")
            logging.debug(f"Scan posts table response: {response}")
            all_items = response.get('Items', [])
            
            filtered_items = [item for item in all_items if 'title' in item and 'description' in item]

            if post_type:
                filtered_items = [item for item in filtered_items if item.get('post_type') == post_type]

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
    if _sanity_client:
        try:
            query_parts = ['*[_type == "post"']
            if main:
                query_parts.append(f'postType == "{main.lower()}"')
            if subs:
                subs_query = ' || '.join([f'"{s}" in tags' for s in subs])
                query_parts.append(f'({subs_query})')
            query = ' && '.join(query_parts) + ']'
            if tab == "Trending":
                query += " | order(count(advertisingTags) desc)"
            elif tab == "Newest":
                query += " | order(date desc)"
            return _sanity_client.query_documents(query)
        except Exception as e:
            logging.error(f"Sanity filter posts failed: {e}")
            return []
    else:
        try:
            filter_expr = None
            if main and main.lower() != "null":
                filter_expr = Attr('post_type').eq(main.lower())  

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
            logging.debug(f"Filter posts response: {response}")  
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
        logging.debug(f"Password update response: {response}")  
        return True
    except ClientError as e:
        logging.error(f"Password update failed for user {user_id}: {e}")
        return False


def update_user_2fa(user_id: str, secret: str, enabled: bool = False) -> bool:
    """Update user's 2FA settings"""
    try:
        response = users_table.update_item(
            Key={'user_id': user_id},
            UpdateExpression="SET two_factor_secret = :s, two_factor_enabled = :e",
            ExpressionAttributeValues={
                ':s': secret,
                ':e': enabled
            }
        )
        logging.debug(f"2FA settings updated for user: {user_id}")
        logging.debug(f"2FA update response: {response}")
        return True
    except ClientError as e:
        logging.error(f"2FA update failed for user {user_id}: {e}")
        return False


def verify_2fa_code(user_id: str, code: str) -> bool:
    """Verify a 2FA code for a user"""
    try:
        user = get_user_from_db(user_id)
        if not user or not user.get('two_factor_secret'):
            return False

        totp = pyotp.TOTP(user['two_factor_secret'])
        return totp.verify(code)
    except Exception as e:
        logging.error(f"2FA verification failed for user {user_id}: {e}")
        return False
