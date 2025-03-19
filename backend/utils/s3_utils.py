import aioboto3
import os

async def upload_file_to_s3(file, bucket_name):
    session = aioboto3.Session()
    async with session.client("s3") as s3:
        await s3.upload_fileobj(file, bucket_name, file.filename)
