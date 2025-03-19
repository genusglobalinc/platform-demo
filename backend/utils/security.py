import jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY")

def create_jwt(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm="HS256")
