
from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.athlete_profile import router as athlete_profile_router

app = FastAPI(
    title="IronMind AI API",
    description="AI-powered bodybuilding and powerlifting platform",
    version="0.1.0"
)
from app.api.routes.auth import router as auth_router

app.include_router(health_router, tags=["Health"])
app.include_router(athlete_profile_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to IronMind AI",
        "version": "0.1.0",
        "status": "running"
    }
