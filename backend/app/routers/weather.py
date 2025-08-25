from fastapi import FastAPI, Query, HTTPException, Depends
from fastapi import APIRouter
from datetime import datetime, timedelta
import httpx
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
import sys
import os
import jwt
from app.utils.redis_cache import RedisCache

# Add the parent directory to the Python path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.models.llm_ollama import OllamaLLM
except ImportError:
    OllamaLLM = None
    print("Warning: OllamaLLM not available. Farming tips will be limited.")

router = APIRouter(prefix="/weather", tags=["Weather Processing"])

# Pydantic models for request/response
class WeatherRequest(BaseModel):
    latitude: float
    longitude: float
    start: Optional[str] = None
    end: Optional[str] = None
    crop_type: Optional[str] = None
    include_farming_tips: bool = True
# Utility function to extract user_id from JWT
def get_current_user_id(authorization: str = Depends(lambda: None)):
    # In production, use a proper dependency to extract JWT from headers
    # Here, we expect 'Authorization: Bearer <token>'
    import os
    secret = os.getenv('JWT_SECRET', 'secret')
    if not authorization:
        return None
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            return None
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload.get('sub') or payload.get('user_id')
    except Exception as e:
        print(f"JWT decode error: {e}")
        return None

class FarmingTip(BaseModel):
    type: str  # 'warning', 'alert', 'info', 'recommendation'
    icon: str
    message: str
    color: str
    source: str  # 'ai', 'rule-based'
    priority: int  # 1-5, 5 being highest priority

class WeatherResponse(BaseModel):
    location: Dict[str, float]
    date_range: Dict[str, str]
    open_meteo: Dict[str, Any]
    nasa_power: Dict[str, Any]
    farming_tips: List[FarmingTip]
    weather_summary: Optional[str] = None

# Initialize LLM if available
llm_client = None
redis_cache = RedisCache()
if OllamaLLM:
    try:
        llm_client = OllamaLLM()
        # Check if any model is available
        status = llm_client.get_model_status()
        if status['active_model'] == 'none':
            llm_client = None
            print("Warning: No AI models available (neither Gemini nor Ollama)")
        else:
            print(f"AI farming tips enabled with model: {status['active_model']}")
    except Exception as e:
        print(f"Warning: Failed to initialize LLM client: {e}")
        llm_client = None


async def get_ai_farming_tips(weather_data: Dict[str, Any], crop_type: Optional[str] = None, user_id: Optional[str] = None) -> List[FarmingTip]:
    """Generate AI-powered farming tips using LLM, with Redis context"""
    if not llm_client:
        return []

    try:
        if not user_id:
            print("No user_id provided for Redis caching.")
            return []

        # Store weather data in Redis for user
        redis_cache.set_weather_data(user_id, weather_data)

        # Retrieve user data from Redis (if any)
        user_data = redis_cache.get_user_data(user_id)

        # Prepare context for LLM
        context = {
            'weather_data': weather_data,
            'crop_type': crop_type or 'general crops',
            'user_data': user_data
        }

        # Create a detailed weather summary for the LLM
        weather_summary = ""
        if 'current' in weather_data.get('open_meteo', {}):
            current = weather_data['open_meteo']['current']
            weather_summary += f"Current temperature: {current.get('temperature_2m', 'N/A')}°C, "
            weather_summary += f"Wind speed: {current.get('wind_speed_10m', 'N/A')} km/h. "
        if 'properties' in weather_data.get('nasa_power', {}):
            params = weather_data['nasa_power']['properties']['parameter']
            for param_name, param_data in params.items():
                for date, value in param_data.items():
                    if value != -999.0:
                        param_desc = weather_data['nasa_power']['parameters'].get(param_name, {}).get('longname', param_name)
                        weather_summary += f"{param_desc}: {value} {weather_data['nasa_power']['parameters'].get(param_name, {}).get('units', '')}. "
                        break

        prompt = f"""Based on the following weather conditions, provide 2-3 specific farming recommendations:

Weather Data: {weather_summary}
Crop Type: {crop_type or 'General farming'}

Please provide practical, actionable farming advice considering:
1. Current weather conditions and their impact on crops
2. Immediate actions farmers should take
3. Preventive measures for potential issues
4. Timing recommendations for farming activities

Format each recommendation as a single sentence with clear, practical advice. Focus on actionable steps farmers can implement immediately."""

        response = llm_client.get_agricultural_advice(
            query=prompt,
            category="weather",
            crop=crop_type,
            location=None
        )

        if response.get('success') and response.get('response'):
            ai_response = response['response']
            tips = []
            sentences = [s.strip() for s in ai_response.split('.') if s.strip()]
            for i, sentence in enumerate(sentences[:3]):
                if len(sentence) > 20:
                    tips.append(FarmingTip(
                        type="recommendation",
                        icon="bulb-outline",
                        message=sentence + ".",
                        color="#8BC34A",
                        source="ai",
                        priority=3
                    ))
            return tips
    except Exception as e:
        print(f"Error generating AI farming tips: {e}")
    return []

@router.post("/weather-data", response_model=WeatherResponse)
async def get_weather_data(request: WeatherRequest, authorization: str = Depends(lambda: None)):
    """Get comprehensive weather data with farming tips"""
    try:
        # Default to past 6 months if not provided
        today = datetime.today()
        default_end = today.strftime('%Y%m%d')
        default_start = (today - timedelta(days=180)).strftime('%Y%m%d')

        start = request.start or default_start
        end = request.end or default_end

        # Define the Open-Meteo API
        open_meteo_url = "https://api.open-meteo.com/v1/forecast"
        open_meteo_params = {
            "latitude": request.latitude,
            "longitude": request.longitude,
            "current": "temperature_2m,wind_speed_10m",
            "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m"
        }

        # Define the NASA POWER API
        nasa_power_url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        nasa_power_params = {
            "start": start,
            "end": end,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "community": "AG",
            "parameters": "GWETTOP,PRECTOTCORR,RH2M,T2M,T2M_MAX,T2M_MIN,ALLSKY_SFC_PAR_TOT,CLRSKY_SFC_PAR_TOT,WS2M,GWETROOT,T2MDEW,T2MWET",
            "time-standard": "LST",
            "format": "JSON"
        }

        # Fetch weather data
        async with httpx.AsyncClient(timeout=30) as client:
            open_meteo_resp = await client.get(open_meteo_url, params=open_meteo_params)
            nasa_power_resp = await client.get(nasa_power_url, params=nasa_power_params)

        # Parse responses
        try:
            open_meteo_data = open_meteo_resp.json()
        except Exception as e:
            print(f"Failed to parse Open-Meteo response: {e}")
            open_meteo_data = {"error": "Failed to parse Open-Meteo response."}

        try:
            nasa_power_data = nasa_power_resp.json()
        except Exception as e:
            print(f"Failed to parse NASA POWER response: {e}")
            nasa_power_data = {"error": "Failed to parse NASA POWER response."}

        # Prepare weather data for tip generation
        weather_data = {
            "open_meteo": open_meteo_data,
            "nasa_power": nasa_power_data
        }

        # Extract user_id from JWT
        user_id = get_current_user_id(authorization)
        # Generate farming tips
        farming_tips = []
        if request.include_farming_tips and user_id:
            ai_tips = await get_ai_farming_tips(weather_data, request.crop_type, user_id)
            farming_tips.extend(ai_tips)
            farming_tips.sort(key=lambda x: x.priority, reverse=True)

        # Generate weather summary
        weather_summary = None
        if llm_client and request.include_farming_tips:
            try:
                summary_prompt = f"Provide a brief 2-sentence weather summary for farmers based on current conditions. Temperature: {open_meteo_data.get('current', {}).get('temperature_2m', 'N/A')}°C"
                summary_response = llm_client.chat(summary_prompt)
                if summary_response.get('success'):
                    weather_summary = summary_response['response']
            except Exception as e:
                print(f"Error generating weather summary: {e}")

        return WeatherResponse(
            location={"latitude": request.latitude, "longitude": request.longitude},
            date_range={"start": start, "end": end},
            open_meteo=open_meteo_data,
            nasa_power=nasa_power_data,
            farming_tips=farming_tips,
            weather_summary=weather_summary
        )
        
    except Exception as e:
        print(f"Error in weather endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather data: {str(e)}")

# Backward compatibility endpoint
@router.get("/weather-data")
async def get_weather_data_legacy(
    latitude: float = Query(..., description="Latitude of location"),
    longitude: float = Query(..., description="Longitude of location"),
    start: str = Query(None, description="Start date in YYYYMMDD"),
    end: str = Query(None, description="End date in YYYYMMDD"),
    crop_type: str = Query(None, description="Type of crop for specific advice"),
    include_farming_tips: bool = Query(True, description="Include farming tips in response")
):
    """Legacy GET endpoint for weather data"""
    # For legacy GET, user_id is extracted from JWT if available
    request = WeatherRequest(
        latitude=latitude,
        longitude=longitude,
        start=start,
        end=end,
        crop_type=crop_type,
        include_farming_tips=include_farming_tips
    )
    # Pass authorization header if available (FastAPI will inject if set up)
    return await get_weather_data(request)
