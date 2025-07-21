from fastapi import APIRouter
from app.api.routers.user import user_router
from app.api.routers.whatsapp import whatsapp_router
from app.api.routers.whatsapp import status_router
from app.api.routers.ai_assistant import router as ai_assistant_router
from app.api.routers.weather import weather_router
from app.api.routers.auth import router as auth_router
from app.api.endpoints.experts import router as experts_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(user_router)
router.include_router(whatsapp_router)
router.include_router(status_router)
router.include_router(ai_assistant_router)
router.include_router(weather_router)
router.include_router(experts_router)


