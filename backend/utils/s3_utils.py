import boto3
from fastapi import HTTPException
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
BUCKET_NAME = 'lost-gates-assets'

def upload_file_to_s3(file, filename, token):
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        s3.upload_fileobj(file, BUCKET_NAME, filename)
    except ClientError as e:
        raise HTTPException(status_code=400, detail=f"Error uploading file: {e}")
    return {"message": "File uploaded successfully", "filename": filename}
