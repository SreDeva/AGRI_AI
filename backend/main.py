from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.core.config import settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.routers import auth, users, ai, weather, whatsapp, status_callback
from app.middleware.logging import LoggingMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AGRI AI Backend API with Phone Authentication using Twilio OTP",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add logging middleware
app.add_middleware(LoggingMiddleware)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(weather.router, prefix="/api/v1")
app.include_router(whatsapp.whatsapp_module)  # No prefix for WhatsApp webhook
app.include_router(status_callback.status_callback_module)  # Webhook prefix is in router


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to AGRI AI Backend API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": "2025-07-29",
        "version": settings.VERSION
    }


@app.get("/api/v1/health")
async def api_health_check():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "api_version": "v1",
        "timestamp": "2025-07-29"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )