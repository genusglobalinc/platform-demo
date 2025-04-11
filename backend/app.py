import os
import asyncio
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
import redis.asyncio as aioredis
from redis.exceptions import ConnectionError

# Import routers
from backend.routes.users import router as users_router
from backend.routes.posts import router as posts_router
from backend.routes.events import router as events_router
from backend.routes.auth_routes import router as auth_router
from backend.utils.security import create_access_token, verify_access_token
from backend.database import (
    get_user_from_db, 
    get_post_from_db, 
    create_post_in_db,
    get_event_from_db, 
    register_user_for_event
)

app = FastAPI()

# Enable CORS (update allow_origins appropriately for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check route
@app.get("/api/health")
def health():
    return {"status": "ok"}

# Mount static files from React build if available
STATIC_DIR = os.path.join("frontend", "build", "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Default route to redirect to API docs (for debugging)
@app.get("/")
def root():
    return RedirectResponse(url="/docs")

# Initialize rate limiting with retries for Redis
@app.on_event("startup")
async def startup():
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        raise HTTPException(status_code=500, detail="Redis URL not found in environment variables")

    redis_client = None
    for attempt in range(5):
        try:
            redis_client = aioredis.from_url(redis_url, encoding="utf-8", decode_responses=True, socket_timeout=10)
            await redis_client.ping()
            break
        except (ConnectionError, TimeoutError) as e:
            if attempt == 4:
                raise HTTPException(status_code=500, detail=f"Failed to connect to Redis: {str(e)}")
            await asyncio.sleep(2 ** attempt)

    await FastAPILimiter.init(redis_client)

# Include routers with their prefixes
app.include_router(users_router, prefix="/users")
app.include_router(posts_router, prefix="/posts")
app.include_router(events_router, prefix="/events")
app.include_router(auth_router, prefix="/auth/register")

# OAuth2 setup for protected routes
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Sample protected route for getting a post
@app.get("/posts/{post_id}", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def get_post(post_id: str, token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    post = get_post_from_db(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return post

# Sample protected route for creating a post
@app.post("/posts", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def create_post(post: dict, token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = get_user_from_db(payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    post_id = create_post_in_db(post, user["user_id"])
    return {"message": "Post created", "post_id": post_id}

# Protected route for event registration
@app.post("/events/{post_id}/register", dependencies=[Depends(RateLimiter(times=3, seconds=60))])
async def register_for_event(post_id: str, token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    event = get_event_from_db(post_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    registration_id = register_user_for_event(payload["sub"], post_id)
    return {"message": "Successfully registered for the event", "registration_id": registration_id}

# Protected route for getting a user profile
@app.get("/users/{user_id}/profile", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def get_user_profile(user_id: str, token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    if not payload or payload["sub"] != user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_profile = get_user_from_db(user_id)
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    return user_profile

# Protected route for fetching "events" (placeholder using posts by user)
@app.get("/events", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def get_all_events(token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Placeholder: using posts by user as "events" for now
    from backend.database import get_posts_by_user  
    events = get_posts_by_user(payload["sub"])
    return {"events": events}

# Serve React App's index.html for any non-API route
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    # Do not override API routes
    if full_path.startswith(("api", "auth", "users", "posts", "events", "static")):
        raise HTTPException(status_code=404, detail="Not a frontend route")
    index_file = os.path.join("frontend", "build", "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Frontend not found")

# Local development run
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
