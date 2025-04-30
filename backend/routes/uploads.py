from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from typing import Any

from backend.utils.security import verify_access_token
from backend.database import _sanity_client

router = APIRouter(tags=["Uploads"])

# Re-use the same token url as other routers
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    token: str = Depends(oauth2_scheme),
) -> dict[str, Any]:
    """Accept an image file, upload it to Sanity and return the reference object."""
    # Auth
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or missing token")

    if not _sanity_client:
        raise HTTPException(status_code=500, detail="Sanity client not initialised")

    try:
        content_type = file.content_type or "application/octet-stream"
        file_bytes = await file.read()
        img_ref = _sanity_client.upload_image_bytes(file_bytes, content_type)
        return {"image": img_ref}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
