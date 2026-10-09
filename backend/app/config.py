"""
RidePool AI Backend Configuration
"""
import os
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
    # Load .env from backend directory or project root
    env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(dotenv_path=env_path)
    if not os.getenv("SUPABASE_URL"):
        root_env = Path(__file__).resolve().parent.parent.parent / "frontend" / ".env"
        load_dotenv(dotenv_path=root_env)
except ImportError:
    pass

class Settings(BaseModel):
    PROJECT_NAME: str = "RidePool AI"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Server / Render Deployment Configuration
    PORT: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))
    HOST: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    ENVIRONMENT: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "production"))
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", "*").split(",")
            if origin.strip()
        ]
    )
    
    # Supabase Database Configuration
    SUPABASE_URL: str = Field(default_factory=lambda: os.getenv("SUPABASE_URL", ""))
    SUPABASE_KEY: str = Field(
        default_factory=lambda: os.getenv(
            "SUPABASE_SERVICE_ROLE_KEY",
            os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
        )
    )
    
    @property
    def is_supabase_configured(self) -> bool:
        return bool(
            self.SUPABASE_URL
            and self.SUPABASE_KEY
            and not self.SUPABASE_URL.startswith("YOUR_")
            and not self.SUPABASE_KEY.startswith("YOUR_")
        )

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
    OSRM_BASE_URL: str = Field(default_factory=lambda: os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org"))

settings = Settings()
