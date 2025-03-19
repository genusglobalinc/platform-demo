import os
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
DYNAMO_TABLE_NAME = os.getenv("DYNAMO_TABLE_NAME")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
