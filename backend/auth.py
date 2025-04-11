from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
import jwt
import os

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")
SECRET_KEY = os.getenv("SECRET_KEY")

def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/change-password")
async def change_password(data: dict, token: dict = Depends(lambda: _get_verified_token())):
    from backend.database import get_user_from_db, update_user_password
    from backend.utils.security import verify_password, hash_password

    user_id = token.get("sub")
    user = get_user_from_db(user_id)

    if not user or not verify_password(data["old_password"], user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect old password")

    update_user_password(user_id, hash_password(data["new_password"]))
    return {"message": "Password changed successfully"}
