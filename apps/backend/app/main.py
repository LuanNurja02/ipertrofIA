
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.athlete_profile import router as athlete_profile_router
from app.api.routes.auth import router as auth_router


app = FastAPI(
    title="ipertrofIA API",
    description="AI-powered bodybuilding and powerlifting platform",
    version="0.1.0"
)


# Allow requests from the local ipertrofIA frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(health_router, tags=["Health"])
app.include_router(athlete_profile_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to ipertrofIA",
        "version": "0.1.0",
        "status": "running"
    }

