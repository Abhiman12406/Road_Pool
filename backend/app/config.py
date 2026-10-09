"""
RidePool AI Backend Configuration
"""
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "RidePool AI"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Geographic Profile - Pune, India
    CITY_NAME: str = "Pune, Maharashtra, India"
    CURRENCY_SYMBOL: str = "₹"
    CURRENCY_CODE: str = "INR"
    PUNE_CENTER_LAT: float = 18.5204
    PUNE_CENTER_LNG: float = 73.8567
    
    # Algorithmic & Simulation Defaults
    DEFAULT_WINDOW_INTERVAL_SEC: int = 45
    DEFAULT_BATCH_SIZE_THRESHOLD: int = 6
    MAX_DETOUR_PERCENT: float = 15.0  # Strict 15% Detour Cap
    
    # Pricing Model Parameters (INR)
    BASE_FARE_INR: float = 40.0
    RATE_PER_KM_INR: float = 18.0
    RATE_PER_MIN_INR: float = 2.5
    
    # OSRM Service URL (public demo or local container)
    OSRM_BASE_URL: str = "https://router.project-osrm.org"

settings = Settings()
