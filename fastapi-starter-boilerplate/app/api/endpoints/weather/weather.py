from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Dict
from .weather_service import weather_service
from app.utils.auth import get_current_user
from app.services.auth_service import auth_service

weather_module = APIRouter()

class LocationRequest(BaseModel):
    latitude: float
    longitude: float
    days: int = 7

class WeatherAdviceResponse(BaseModel):
    location: Dict[str, float]
    forecast_days: int
    advice: List[Dict]
    summary: str

@weather_module.post("/forecast-advice", response_model=WeatherAdviceResponse)
async def get_weather_advice(location: LocationRequest):
    """Get weather forecast with farming advice"""
    try:
        # Get weather data
        weather_data = await weather_service.get_weather_forecast(
            location.latitude, 
            location.longitude, 
            location.days
        )
        
        # Generate farming advice
        advice = weather_service.generate_farming_advice(weather_data)
        
        # Generate summary
        summary = _generate_summary(advice)
        
        return WeatherAdviceResponse(
            location={"latitude": location.latitude, "longitude": location.longitude},
            forecast_days=location.days,
            advice=advice,
            summary=summary
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _generate_summary(advice: List[Dict]) -> str:
    """Generate a summary of the weather advice"""
    rain_days = sum(1 for day in advice if any("rain" in rec.lower() for rec in day["recommendations"]))
    hot_days = sum(1 for day in advice if any("hot" in rec.lower() or "heat" in rec.lower() for rec in day["recommendations"]))
    
    summary = f"📊 {len(advice)}-day forecast summary:\n"
    
    if rain_days > 0:
        summary += f"🌧️ {rain_days} days with rain expected - adjust watering schedule\n"
    if hot_days > 0:
        summary += f"🌡️ {hot_days} days with high temperatures - increase irrigation\n"
    
    summary += "💡 Check daily recommendations for specific actions"
    
    return summary