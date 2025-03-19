"""import os
from dotenv import load_dotenv

load_dotenv()

AWS_COGNITO_USER_POOL_ID = os.getenv("AWS_COGNITO_USER_POOL_ID")
AWS_COGNITO_CLIENT_ID = os.getenv("AWS_COGNITO_CLIENT_ID")
AWS_COGNITO_REGION = os.getenv("AWS_COGNITO_REGION")

AWS_DYNAMODB_TABLE_NAME = os.getenv("AWS_DYNAMODB_TABLE_NAME")
AWS_DYNAMODB_REGION = os.getenv("AWS_DYNAMODB_REGION")

AWS_S3_BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")
AWS_S3_REGION = os.getenv("AWS_S3_REGION")

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")"""

import os
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION")
SECRET_KEY = os.getenv("SECRET_KEY")
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE")
