from fastapi import APIRouter
from app.api.endpoints.weather.weather import weather_module

weather_router = APIRouter()

weather_router.include_router(
    weather_module,
    prefix="/weather",
    tags=["weather"],
    responses={404: {"description": "Not found"}},
)