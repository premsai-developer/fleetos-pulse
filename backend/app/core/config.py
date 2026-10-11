from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "FleetOS Pulse API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./fleetos_pulse.db"
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    # Dynamic Pricing & FairFare Guard Rules
    STALE_THRESHOLD_MINUTES: int = 30
    MIN_FARE_MULTIPLIER: float = 0.75
    MAX_FARE_MULTIPLIER: float = 1.35
    MAX_STEP_CHANGE_PERCENT: float = 15.0

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
