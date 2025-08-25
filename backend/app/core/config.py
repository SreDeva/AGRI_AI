import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "AGRI AI Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database Settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "agri_ai"
    
    # JWT Settings
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Twilio Settings
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")
    
    # OTP Settings
    OTP_EXPIRE_MINUTES: int = 5
    OTP_LENGTH: int = 6
    
    # AI Models Settings
    GEMINI_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3:8b"
    
    # Redis Settings
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # CORS Settings
    CORS_ORIGINS: list = ["*"]
    
    class Config:
        env_file = ".env"


settings = Settings()
