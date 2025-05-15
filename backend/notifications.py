from datetime import datetime
import uuid
import logging
from typing import Optional, Dict, Any

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

# Attempt to import the Sanity client from the project
try:
    from backend.sanity_client import SanityClient
    _sanity_client = SanityClient()
except Exception as e:
    _sanity_client = None
    logging.warning(f"Sanity client not initialized for notifications: {e}")

logger = logging.getLogger(__name__)

# DynamoDB fallback setup (used if Sanity is not configured)
dynamodb = boto3.resource("dynamodb", region_name="us-east-2")
notifications_table = dynamodb.Table("Notifications")


def send_notification(
    recipient_id: str,
    message: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    """Create a notification entry for a single recipient.

    Depending on the environment, this will either create a Sanity document of
    type `notification` **or** store a record in the DynamoDB `Notifications`
    table. The function is best-effort and will return ``False`` on failure so
    the caller can decide whether a hard failure is required.
    """
    timestamp_iso = datetime.utcnow().isoformat()
    notif_id = str(uuid.uuid4())

    # If a Sanity client is configured, create a document there
    if _sanity_client:
        try:
            doc = {
                "_type": "notification",
                "_id": notif_id,
                "recipientId": recipient_id,
                "message": message,
                "metadata": metadata or {},
                "createdAt": timestamp_iso,
            }
            _sanity_client.create_document("notification", doc)
            logger.debug(f"[send_notification] Sanity notification created: {notif_id}")
            return True
        except Exception as e:
            logger.error(f"[send_notification] Failed to create Sanity notification: {e}")
            # Fall through to DynamoDB as secondary storage

    # DynamoDB fallback
    try:
        item = {
            "recipient_id": recipient_id,
            "notification_id": notif_id,
            "message": message,
            "created_at": timestamp_iso,
        }
        if metadata is not None:
            item["metadata"] = metadata
        notifications_table.put_item(Item=item)
        logger.debug(f"[send_notification] DynamoDB notification created: {notif_id}")
        return True
    except ClientError as e:
        logger.error(f"[send_notification] DynamoDB put_item failed: {e}")
        return False
