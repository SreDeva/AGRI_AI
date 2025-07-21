from fastapi import APIRouter
from app.api.endpoints.whatsapp.whatsapp import whatsapp_module
from app.api.endpoints.whatsapp.status_callback import starus_module

whatsapp_router = APIRouter()
status_router = APIRouter()

whatsapp_router.include_router(
    whatsapp_module,
    prefix="/whatsapp",
    responses={404: {"description": "Not found"}},
)

status_router.include_router(
    starus_module,
    prefix="/whatsapp",
    responses={404: {"description": "Not found"}},
)