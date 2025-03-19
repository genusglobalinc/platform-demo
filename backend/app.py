from fastapi import FastAPI
from routes.users import router as users_router
from routes.posts import router as posts_router
from routes.events import router as events_router
from routes.auth_routes import router as auth_router

app = FastAPI(
    title="Indie Game Tester API",
    description="FastAPI-powered backend for managing users, posts, events, and authentication.",
    version="1.0.0"
)

# Register API Routes
app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(posts_router, prefix="/posts", tags=["Posts"])
app.include_router(events_router, prefix="/events", tags=["Events"])
app.include_router(auth_router, prefix="/auth", tags=["Auth"])

@app.get("/")
def root():
    return {"message": "Indie Game Tester API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
