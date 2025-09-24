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

# Handle compatibility with different Pydantic versions
try:
    # Try Pydantic v2.x import first
    from pydantic_settings import BaseSettings
    from pydantic import Field
except ImportError:
    # Fall back to Pydantic v1.x import
    from pydantic import BaseSettings, Field

load_dotenv()

class Settings(BaseSettings):
    """Environment settings. Only some are strictly required by all endpoints.

    Optional values default to an empty string so Pydantic does not raise a
    validation error if the variable is missing (e.g. when only email-related
    settings are needed)."""

    # AWS Configuration (optional for endpoints that don't hit DynamoDB)
    aws_region: str = Field(default_factory=lambda: os.getenv("AWS_REGION", ""))
    dynamodb_table: str = Field(default_factory=lambda: os.getenv("DYNAMODB_TABLE", ""))

    # Security (required)
    secret_key: str = Field(default_factory=lambda: os.getenv("SECRET_KEY", ""))

    # Email Configuration
    email_sender: str = os.getenv("EMAIL_SENDER", "noreply@lostgates.com")
    smtp_server: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: str = os.getenv("SMTP_USERNAME", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    smtp_use_tls: bool = os.getenv("SMTP_USE_TLS", "True").lower() in ("true", "1", "t")

    # Steam API Configuration
    steam_api_key: str = os.getenv("STEAM_API_KEY", "")

    class Config:
        env_file = ".env"

def get_settings():
    return Settings()

# Backward compatibility
AWS_REGION = os.getenv("AWS_REGION")
SECRET_KEY = os.getenv("SECRET_KEY")
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE")
STEAM_API_KEY = os.getenv("STEAM_API_KEY")
