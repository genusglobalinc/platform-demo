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
logger = logging.getLogger(__name__)

try:
    _sanity_client = SanityClient()
except Exception as e:
    _sanity_client = None
    logger.warning(f"Sanity client not initialized: {e}")

def save_to_dynamodb(item: dict, table_name: str):
    table = dynamodb.Table(table_name)
    try:
        response = table.put_item(Item=item)
        logger.debug(f"[save_to_dynamodb] Saved item to {table_name}: {item}")
        logger.debug(f"[save_to_dynamodb] Response: {response}")  
        return response
    except ClientError as e:
        logger.error(f"[save_to_dynamodb] Error saving to {table_name}: {e}")
        return None

# --- User Management ---

def create_user_in_sanity(user_id: str, user_data: dict) -> Optional[str]:
    """Persist a public (non-sensitive) user profile document in Sanity.
    This is best-effort; failures are logged but do not block user creation.
    """
    if not _sanity_client:
        logger.info("[create_user_in_sanity] Sanity client not configured; skipping")
        return None

    # Only include non-sensitive fields
    doc_data = {
        "_id": user_id,  # keep IDs aligned across both DBs
        "username": user_data["username"],
        "email": user_data["email"],
        "display_name": user_data.get("display_name", ""),
        "profile_picture": user_data.get("profile_picture", ""),
        "social_links": user_data.get("social_links", ""),
        "followers": 0,
        "following": 0,
        "user_type": user_data.get("user_type", "Tester"),
        "is_verified": user_data.get("is_verified", False),
        "created_at": str(datetime.utcnow()),
    }
    try:
        doc_id = _sanity_client.create_document("user", doc_data)
        logger.debug(f"[create_user_in_sanity] Created Sanity user: {doc_id}")
        return doc_id
    except Exception as e:
        logger.error(f"[create_user_in_sanity] Failed to create user in Sanity: {e}")
        return None

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
        "two_factor_enabled": user_data.get("two_factor_enabled", False),
        "user_type": user_data.get("user_type", "Tester")
    }
    try:
        response = users_table.put_item(Item=item)
        logger.debug(f"[create_user_in_db] Created user: {item}")
        logger.debug(f"[create_user_in_db] Database response: {response}")
        # Persist a non-sensitive backup of the user profile to Sanity (best-effort)
        create_user_in_sanity(user_id, user_data)
        return user_id
    except ClientError as e:
        logger.error(f"[create_user_in_db] User creation failed: {e}")
        return None

def get_user_from_db(user_id: str) -> Optional[Dict[str, str]]:
    try:
        response = users_table.get_item(Key={'user_id': user_id})
        
        logger.debug(f"[get_user_from_db] Get user response: {response}")

        user_item = response.get('Item')
        
        if not user_item:
            logger.warning(f"[get_user_from_db] User with user_id {user_id} not found in database.")
            return None
        
        return user_item

    except ClientError as e:
        logger.error(f"[get_user_from_db] Get user failed for user_id {user_id}: {e}")
        return None

    except Exception as e:
        logger.error(f"[get_user_from_db] Unexpected error occurred while fetching user {user_id}: {e}")
        return None

def get_user_by_email(email: str) -> Optional[dict]:
    try:
        response = users_table.get_item(Key={'email': email})
        logger.debug(f"[get_user_by_email] Get user by email response: {response}")  
        return response.get('Item')
    except ClientError as e:
        logger.error(f"[get_user_by_email] Get user by email failed: {e}")
        return None

def get_user_by_username(username: str) -> Optional[dict]:
    try:
        response = users_table.scan(FilterExpression=Attr('username').eq(username))
        logger.debug(f"[get_user_by_username] Get user by username response: {response}")  
        items = response.get('Items', [])
        return items[0] if items else None
    except ClientError as e:
        logger.error(f"[get_user_by_username] Get user by username failed: {e}")
        return None

def update_user_verification(email: str, is_verified: bool) -> bool:
    try:
        response = users_table.update_item(
            Key={'email': email},
            UpdateExpression="SET is_verified = :v",
            ExpressionAttributeValues={':v': is_verified}
        )
        logger.debug(f"[update_user_verification] Update verification response: {response}")  
        return True
    except ClientError as e:
        logger.error(f"[update_user_verification] Verification update failed: {e}")
        return False

def update_reset_token(email: str, reset_token: str) -> bool:
    try:
        response = users_table.update_item(
            Key={'email': email},
            UpdateExpression="SET reset_token = :t",
            ExpressionAttributeValues={":t": reset_token}
        )
        logger.debug(f"[update_reset_token] Update reset token response: {response}")  
        return True
    except ClientError as e:
        logger.error(f"[update_reset_token] Reset token update failed: {e}")
        return False

def update_user_password_by_email(email: str, new_password: str) -> bool:
    try:
        hashed = hash_password(new_password)
        response = users_table.update_item(
            Key={'email': email},
            UpdateExpression="SET password = :p, reset_token = :empty",
            ExpressionAttributeValues={":p": hashed, ":empty": ""}
        )
        logger.debug(f"[update_user_password_by_email] Password update response: {response}")  
        return True
    except ClientError as e:
        logger.error(f"[update_user_password_by_email] Password update failed: {e}")
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
        logger.error(f"[verify_2fa_code] 2FA verification failed: {e}")
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
        logger.debug(f"[update_user_profile] Profile updated for user_id {user_id}: {profile_data}")
        logger.debug(f"[update_user_profile] DynamoDB response: {response}")
        return True

    except ClientError as e:
        logger.error(f"[update_user_profile] Profile update failed: {e}")
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
                    logger.error(f"[create_post_in_db] Failed to upload image {img}: {img_err}")

            sanity_payload = {
                "title": post_data.get("title"),
                "description": post_data.get("description"),
                "postType": post_data.get("post_type") or post_data.get("type"),
                "tags": post_data.get("tags", []),
                "studio": post_data.get("studio"),
                "bannerImage": {
                    "image": banner_ref,
                    "url": banner_val if isinstance(banner_val, str) else None,
                } if banner_ref else None,
                "images": image_refs,
                "testerId": user_id,
                "status": "draft",
                "date": str(datetime.utcnow()),
            }

            # Remove keys with None/empty values to satisfy schema validation
            sanity_payload = {
                k: v
                for k, v in sanity_payload.items()
                if v not in (None, "", [], {})
            }

            if "bannerImage" not in sanity_payload:
                logger.error("[create_post_in_db] bannerImage is required but missing")
                return None

            logger.debug(f"[create_post_in_db] Sanity payload: {sanity_payload}")

            return _sanity_client.create_document("post", sanity_payload)
        except Exception as e:
            logger.error(f"[create_post_in_db] Sanity create post failed: {e}")
            return None
    else:
        post_id = str(uuid.uuid4())

        if 'title' not in post_data or 'description' not in post_data:
            logger.error("[create_post_in_db] Title and description are mandatory fields.")
            return None

        if 'post_type' not in post_data and 'type' in post_data:
            post_data['post_type'] = post_data.pop('type')

        if post_data.get('post_type') not in ['gaming']:
            logger.error("[create_post_in_db] Invalid post_type. Must be 'gaming'.")
            return None

        post_data.update({
            'post_id': post_id,
            'user_id': user_id,
            'created_at': str(datetime.utcnow())
        })

        logger.debug(f"[create_post_in_db] Attempting to save post to DynamoDB. Data: {post_data}")

        try:
            serialized_data = jsonable_encoder(post_data)  
            response = posts_table.put_item(Item=serialized_data)
            logger.debug(f"[create_post_in_db] Post saved successfully. Response: {response}")
            return post_id
        except ClientError as e:
            logger.error(f"[create_post_in_db] [ClientError] Failed: {e.response['Error']['Message']}")
        except Exception as e:
            logger.exception(f"[create_post_in_db] Unexpected error: {e}")
        return None

def get_post_from_db(post_id: str) -> Optional[dict]:
    if _sanity_client:
        try:
            return _sanity_client.get_document(post_id)
        except Exception as e:
            logger.error(f"[get_post_from_db] Sanity get post failed: {e}")
            return None
    else:
        try:
            response = posts_table.get_item(Key={'post_id': post_id})
            logger.debug(f"[get_post_from_db] Get post response: {response}")  
            return response.get('Item')
        except ClientError as e:
            logger.error(f"[get_post_from_db] Get post failed: {e}")
            return None

def get_posts_by_user(user_id: str) -> List[dict]:
    """Return all posts owned by user from Sanity or Dynamo."""
    if _sanity_client:
        try:
            query = f'*[_type == "post" && testerId == "{user_id}"] | order(date desc)'
            results = _sanity_client.query_documents(query)
            logger.debug(f"[get_posts_by_user] Sanity results: {len(results)} items")
            return results
        except Exception as e:
            logger.error(f"[get_posts_by_user] Sanity query failed: {e}")
            return []
    # Dynamo fallback
    try:
        response = posts_table.query(
            IndexName="user_id-index",
            KeyConditionExpression=Key('user_id').eq(user_id)
        )
        logger.debug(f"[get_posts_by_user] Dynamo response: {response}")
        return response.get('Items', [])
    except ClientError as e:
        logger.error(f"[get_posts_by_user] Dynamo query failed: {e}")
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
            logger.error(f"[get_all_posts_from_db] Sanity get all posts failed: {e}")
            return []
    else:
        try:
            response = posts_table.scan()
            logger.debug("[get_all_posts_from_db] Scanned posts table successfully.")
            logger.debug(f"[get_all_posts_from_db] Scan posts table response: {response}")
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
            logger.error(f"[get_all_posts_from_db] Error scanning posts table: {e}")
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
            logger.error(f"[filter_posts_from_db] Sanity filter posts failed: {e}")
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
            logger.debug("[filter_posts_from_db] Filtered posts fetched successfully.")
            logger.debug(f"[filter_posts_from_db] Filter posts response: {response}")  
            return response.get('Items', [])
        except ClientError as e:
            logger.error(f"[filter_posts_from_db] Error filtering posts: {e}")
            return []

def update_user_password(user_id: str, new_password: str) -> bool:
    try:
        hashed = hash_password(new_password)
        response = users_table.update_item(
            Key={'user_id': user_id},
            UpdateExpression="SET password = :p",
            ExpressionAttributeValues={":p": hashed}
        )
        logger.debug(f"[update_user_password] Password updated for user: {user_id}")
        logger.debug(f"[update_user_password] Password update response: {response}")  
        return True
    except ClientError as e:
        logger.error(f"[update_user_password] Password update failed for user {user_id}: {e}")
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
        logger.debug(f"[update_user_2fa] 2FA settings updated for user: {user_id}")
        logger.debug(f"[update_user_2fa] 2FA update response: {response}")
        return True
    except ClientError as e:
        logger.error(f"[update_user_2fa] 2FA update failed for user {user_id}: {e}")
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
        logger.error(f"[verify_2fa_code] 2FA verification failed for user {user_id}: {e}")
        return False

# ---------------------------------------------------------------------
# Delete Post
# ---------------------------------------------------------------------

def delete_post_in_db(post_id: str, user_id: str) -> bool:
    """Delete a post from Sanity or DynamoDB depending on environment."""
    if _sanity_client:
        try:
            # Fetch doc to verify ownership
            doc = _sanity_client.get_document(post_id)
            if not doc:
                logger.warning(f"[delete_post_in_db] Document {post_id} not found in Sanity")
                return False
            if doc.get("testerId") != user_id:
                logger.warning("[delete_post_in_db] User does not own this post")
                return False
            _sanity_client.delete_document(post_id)
            logger.debug(f"[delete_post_in_db] Deleted Sanity doc {post_id}")
            return True
        except Exception as e:
            logger.error(f"[delete_post_in_db] Sanity delete failed: {e}")
            return False
    # Dynamo fallback
    try:
        response = posts_table.delete_item(
            Key={"post_id": post_id, "user_id": user_id},
            ConditionExpression=Attr("user_id").eq(user_id)
        )
        logger.debug(f"[delete_post_in_db] Dynamo delete response: {response}")
        return True
    except ClientError as e:
        logger.error(f"[delete_post_in_db] Dynamo delete failed: {e}")
        return False
