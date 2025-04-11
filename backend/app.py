from fastapi import FastAPI, Depends, HTTPException, APIRouter
from fastapi.security import OAuth2PasswordBearer
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from backend.routes.users import router as users_router  # Corrected import
from backend.routes.posts import router as posts_router  # Corrected import
from backend.routes.events import router as events_router  # Corrected import
from backend.routes.auth_routes import router as auth_router  # Corrected import
from backend.utils.security import create_access_token, verify_access_token
from backend.database import get_user_from_db

app = FastAPI()

# Initialize rate limiting
@app.on_event("startup")
async def startup():
    # Initialize FastAPI Limiter with Redis as backend
    await FastAPILimiter.init()

# Include routers for various routes in the app
app.include_router(users_router, prefix="/users")
app.include_router(posts_router, prefix="/posts")
app.include_router(events_router, prefix="/events")
app.include_router(auth_router, prefix="/auth")

# OAuth2PasswordBearer for handling JWT tokens in protected routes
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Routes protected by JWT authentication and rate limiting

@app.get("/posts/{post_id}", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def get_post(post_id: str, token: str = Depends(oauth2_scheme)):
    # Verify token and check user authentication
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Fetch post from database (assuming a function exists to retrieve posts)
    post = get_post_from_db(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return post


@app.post("/posts", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def create_post(post: dict, token: str = Depends(oauth2_scheme)):
    # Verify token and check user authentication
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Only allow authenticated users to create posts
    user = get_user_from_db(payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create post logic (e.g., storing it in DynamoDB)
    post_id = create_post_in_db(post, user["id"])
    return {"message": "Post created", "post_id": post_id}


@app.post("/events/{post_id}/register", dependencies=[Depends(RateLimiter(times=3, seconds=60))])
async def register_for_event(post_id: str, token: str = Depends(oauth2_scheme)):
    # Verify token and check user authentication
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Fetch event details and user information
    event = get_event_from_db(post_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Register user for the event (e.g., save registration in DynamoDB)
    registration_id = register_user_for_event(payload["sub"], post_id)
    return {"message": "Successfully registered for the event", "registration_id": registration_id}


@app.get("/users/{user_id}/profile", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def get_user_profile(user_id: str, token: str = Depends(oauth2_scheme)):
    # Verify token and check user authentication
    payload = verify_access_token(token)
    if not payload or payload["sub"] != user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Fetch user profile (only the authenticated user can access their own profile)
    user_profile = get_user_profile_from_db(user_id)
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    return user_profile


@app.get("/events", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def get_all_events(token: str = Depends(oauth2_scheme)):
    # Verify token and check user authentication
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Fetch all events (for players who are authenticated)
    events = get_all_events_from_db()
    return {"events": events}

# Start the app with FastAPI's default Uvicorn ASGI server when running locally
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
