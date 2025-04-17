import os
import asyncio
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from starlette.requests import Request
import redis.asyncio as aioredis
from redis.exceptions import ConnectionError

# Import routers
from backend.routes.users import router as users_router
from backend.routes.posts import router as posts_router
from backend.routes.auth_routes import router as auth_router
from backend.utils.security import create_access_token, verify_access_token
from backend.database import (
    get_user_from_db,
    get_post_from_db,
    create_post_in_db
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

# Mount React's static files
STATIC_DIR = os.path.join("frontend", "build", "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def root():
    return RedirectResponse(url="/login")

@app.on_event("startup")
async def startup():
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        raise HTTPException(status_code=500, detail="Redis URL not found")

    client = None
    for i in range(5):
        try:
            client = aioredis.from_url(redis_url, encoding="utf-8", decode_responses=True, socket_timeout=10)
            await client.ping()
            break
        except (ConnectionError, TimeoutError):
            if i == 4:
                raise HTTPException(status_code=500, detail="Could not connect to Redis")
            await asyncio.sleep(2 ** i)

    await FastAPILimiter.init(client)

app.include_router(users_router, prefix="/users")
app.include_router(posts_router, prefix="/posts")
app.include_router(auth_router, prefix="/auth")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

@app.get("/api/posts/{post_id}", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def get_post(post_id: str, token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401)
    post = get_post_from_db(post_id)
    if not post:
        raise HTTPException(status_code=404)
    return post

@app.post("/posts", dependencies=[Depends(RateLimiter(times=100, seconds=60))])
async def create_post(post: dict, token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401)
    user = get_user_from_db(payload["sub"])
    if not user:
        raise HTTPException(status_code=404)
    post_id = create_post_in_db(post, user["user_id"])
    return {"message": "Post created", "post_id": post_id}

@app.get("/users/{user_id}/profile", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def get_user_profile(user_id: str, token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    if not payload or payload["sub"] != user_id:
        raise HTTPException(status_code=401)
    profile = get_user_from_db(user_id)
    if not profile:
        raise HTTPException(status_code=404)
    return profile

# ←――――――――――――――――――――――――――――――――――――――――――――――――――
# Catch-all: strip leading slash before checking prefixes!
@app.get("/{full_path:path}")
async def serve_react_app(request: Request, full_path: str):
    # Remove leading slash so we can match against "posts", "auth", etc.
    path = request.url.path.lstrip("/")
    # If it starts with one of these, let FastAPI return 404 (or your API router handle it)
    if path.startswith(("api", "auth", "users", "posts", "static")):
        raise HTTPException(status_code=404, detail="Not a frontend route")
    # Otherwise serve React's index.html
    index_file = os.path.join("frontend", "build", "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Frontend not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
