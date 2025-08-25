from datetime import datetime
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log request
        logger.info(f"Request: {request.method} {request.url.path}")
        
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Log response
        logger.info(
            f"Response: {response.status_code} | "
            f"Time: {process_time:.4f}s | "
            f"Path: {request.url.path}"
        )
        
        # Add processing time to response headers
        response.headers["X-Process-Time"] = str(process_time)
        
        return response


class CORSMiddleware:
    """Custom CORS middleware"""
    def __init__(self, app, allowed_origins=None):
        self.app = app
        self.allowed_origins = allowed_origins or ["*"]

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            if request.method == "OPTIONS":
                response = Response()
                response.headers["Access-Control-Allow-Origin"] = "*"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
                await response(scope, receive, send)
                return

        await self.app(scope, receive, send)
