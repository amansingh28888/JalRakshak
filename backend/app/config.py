"""
JalRakshak — Application Configuration
All settings are sourced from environment variables.
Never hard-code secrets in this file.
"""
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    log_level: str = "INFO"

    # Database
    database_url: str = "sqlite:///./data/water_quality.db"

    # CORS
    frontend_origin: str = "http://localhost:5173"

    # Supabase Auth
    supabase_url: Optional[str] = None
    supabase_service_role_key: Optional[str] = None

    # Gemini AI — NEVER expose to frontend
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-3.6-flash"

    # Data paths
    raw_data_path: str = "./data/raw/India_Water_Quality_Dataset_50000.csv"
    processed_data_path: str = "./data/processed/water_quality_clean.csv"

    # TTS (Bhashini) — optional
    bhashini_api_key: Optional[str] = None
    bhashini_user_id: Optional[str] = None

    @property
    def gemini_available(self) -> bool:
        """True only when a non-empty API key is configured."""
        return bool(self.gemini_api_key and self.gemini_api_key.strip())

    @property
    def bhashini_available(self) -> bool:
        return bool(self.bhashini_api_key and self.bhashini_api_key.strip())

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() == "development"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — call this everywhere instead of importing Settings directly."""
    return Settings()
