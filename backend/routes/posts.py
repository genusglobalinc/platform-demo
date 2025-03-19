from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_posts():
    return {"posts": ["Post1", "Post2"]}
