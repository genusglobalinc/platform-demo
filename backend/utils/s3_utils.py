import boto3
import os

s3 = boto3.client('s3')

def upload_file_to_s3(file_name, bucket_name, object_name=None):
    """Uploads a file to S3 and returns the file URL"""
    if object_name is None:
        object_name = file_name
    try:
        s3.upload_file(file_name, bucket_name, object_name)
        return f"https://{bucket_name}.s3.amazonaws.com/{object_name}"
    except Exception as e:
        print(f"Error uploading to S3: {e}")
        return None
