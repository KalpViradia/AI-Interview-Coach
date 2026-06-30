"""
Application configuration — loads from .env via Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


from pydantic import field_validator

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "AI Interview Coach"
    debug: bool = False

    # Database
    database_url: str = "postgresql+psycopg://user:password@localhost:5432/interview_coach"

    @field_validator("database_url")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+psycopg://", 1)
        elif v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+psycopg://", 1)
            
        return v

    # Gemini API
    gemini_api_key: str = ""

    # ChromaDB
    chroma_persist_directory: str = "./chroma_db"

    # CORS
    frontend_url: str = "http://localhost:3000"
    cors_origins: str = "" # Comma-separated list of allowed origins

    @field_validator("frontend_url")
    @classmethod
    def strip_trailing_slash(cls, v: str) -> str:
        return v.rstrip("/")

    # Auth — must match NEXTAUTH_SECRET in the frontend .env.local
    nextauth_secret: str = ""

    # Telemetry
    anonymized_telemetry: bool = False

    # Speech Recognition
    speech_provider: str = "browser"    # "browser" | "faster-whisper"
    whisper_model: str = "base"         # tiny | base | small | medium | large-v3

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — avoids re-reading .env on every call."""
    return Settings()
