import httpx
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class WeatherService:
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    
    async def get_weather_forecast(self, latitude: float, longitude: float, days: int = 7) -> Dict:
        """Get weather forecast for given coordinates"""
        try:
            params = {
                "latitude": latitude,
                "longitude": longitude,
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max,weathercode",
                "hourly": "temperature_2m,precipitation,precipitation_probability,weathercode",
                "timezone": "auto",
                "forecast_days": days
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            logger.error(f"Weather API error: {e}")
            raise Exception("Failed to fetch weather data")
    
    def generate_farming_advice(self, weather_data: Dict) -> List[Dict]:
        """Generate farming advice based on weather forecast"""
        advice_list = []
        daily = weather_data.get("daily", {})
        
        for i in range(len(daily.get("time", []))):
            date = daily["time"][i]
            temp_max = daily["temperature_2m_max"][i]
            temp_min = daily["temperature_2m_min"][i]
            precipitation = daily["precipitation_sum"][i]
            rain_probability = daily["precipitation_probability_max"][i]
            wind_speed = daily["windspeed_10m_max"][i]
            weather_code = daily["weathercode"][i]
            
            advice = self._get_daily_advice(
                date, temp_max, temp_min, precipitation, 
                rain_probability, wind_speed, weather_code, i
            )
            advice_list.append(advice)
            
        return advice_list
    
    def _get_daily_advice(self, date: str, temp_max: float, temp_min: float, 
                         precipitation: float, rain_prob: int, wind_speed: float, 
                         weather_code: int, day_index: int) -> Dict:
        """Generate specific advice for a day"""
        advice = {
            "date": date,
            "temperature": f"{temp_min:.1f}°C - {temp_max:.1f}°C",
            "precipitation": f"{precipitation:.1f}mm",
            "rain_probability": f"{rain_prob}%",
            "recommendations": []
        }
        
        # Watering advice
        if precipitation > 5 or rain_prob > 70:
            advice["recommendations"].append("🚫 Skip watering today - rain expected")
            if day_index == 0:
                advice["recommendations"].append("💧 If you watered yesterday, reduce today's irrigation")
        elif precipitation < 1 and rain_prob < 30:
            if temp_max > 30:
                advice["recommendations"].append("💧 Increase watering - hot and dry conditions")
            else:
                advice["recommendations"].append("💧 Normal watering schedule recommended")
        
        # Temperature-based advice
        if temp_max > 35:
            advice["recommendations"].append("🌡️ Extreme heat - provide shade for sensitive crops")
            advice["recommendations"].append("⏰ Water early morning or late evening")
        elif temp_min < 10:
            advice["recommendations"].append("🥶 Cold weather - protect sensitive plants")
            advice["recommendations"].append("🌱 Delay planting of warm-season crops")
        
        # Wind advice
        if wind_speed > 20:
            advice["recommendations"].append("💨 Strong winds - secure plant supports")
            advice["recommendations"].append("🚫 Avoid spraying pesticides/fertilizers")
        
        # Weather code specific advice
        if weather_code in [95, 96, 99]:  # Thunderstorms
            advice["recommendations"].append("⛈️ Thunderstorms expected - avoid field work")
        elif weather_code in [71, 73, 75, 77]:  # Snow
            advice["recommendations"].append("❄️ Snow expected - protect crops from frost")
        
        return advice

weather_service = WeatherService()