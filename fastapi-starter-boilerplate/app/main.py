# fastapi
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.core.modules import init_routers, make_middleware
from app.core.mongodb import connect_to_mongo, close_mongo_connection
import logging

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up...")
    await connect_to_mongo()
    yield
    # Shutdown
    logger.info("Shutting down...")
    await close_mongo_connection()

def create_app() -> FastAPI:
    app_ = FastAPI(
        title="Farmer Assistant API",
        description="FastAPI application for farmer assistance with AI, weather, and plant disease detection.",
        version="1.0.0",
        lifespan=lifespan,
        middleware=make_middleware(),
    )

    # Add custom exception handler for validation errors
    @app_.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.error(f"Validation error for {request.method} {request.url}: {exc.errors()}")
        try:
            body = await request.body()
            logger.error(f"Request body: {body}")
            body_str = body.decode('utf-8') if body else "Empty body"
        except Exception as e:
            logger.error(f"Could not read request body: {e}")
            body_str = "Could not read body"

        # Convert validation errors to JSON-serializable format
        error_details = []
        for error in exc.errors():
            error_dict = dict(error)
            # Convert bytes to string if present
            if 'input' in error_dict and isinstance(error_dict['input'], bytes):
                error_dict['input'] = error_dict['input'].decode('utf-8')
            error_details.append(error_dict)

        return JSONResponse(
            status_code=422,
            content={"detail": error_details, "body": body_str}
        )

    app_.mount("/static", StaticFiles(directory="static"), name="static")
    app_.mount("/audio-files", StaticFiles(directory="generated_audio"), name="audio-files")
    init_routers(app_=app_)
    return app_


app = create_app()
