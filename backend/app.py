import os
import asyncio
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.requests import Request
import redis.asyncio as aioredis
from redis.exceptions import ConnectionError

# Import routers
from backend.routes.users import router as users_router
from backend.routes.posts import router as posts_router
from backend.routes.auth_routes import router as auth_router
from backend.utils.security import verify_access_token
from backend.database import get_user_from_db

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

# Mount API routes under `/api`
app.include_router(users_router, prefix="/api/users")
app.include_router(posts_router, prefix="/api/posts")
app.include_router(auth_router, prefix="/api/auth")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

@app.get("/api/users/{user_id}/profile", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def get_user_profile(user_id: str, token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    if not payload or payload["sub"] != user_id:
        raise HTTPException(status_code=401)
    profile = get_user_from_db(user_id)
    if not profile:
        raise HTTPException(status_code=404)
    return profile

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

# Mount static files from React
STATIC_DIR = os.path.join("frontend", "build", "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Catch-all route to serve React index.html
@app.get("/{full_path:path}")
async def serve_react_app(request: Request, full_path: str):
    path = request.url.path.lstrip("/")
    if path.startswith(("api", "static")):
        raise HTTPException(status_code=404, detail="Not a frontend route")
    
    index_file = os.path.join("frontend", "build", "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
    
    raise HTTPException(status_code=404, detail="Frontend not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
