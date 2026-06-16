"""
Application configuration — reads from environment variables.
All secrets are injected at runtime; never hardcoded here.
"""
from __future__ import annotations

from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── Supabase ──────────────────────────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # ── MetaAPI ───────────────────────────────────────────────────────────────
    METAAPI_TOKEN: str = ""
    METAAPI_SYSTEM_ACCOUNT_ID: str = ""

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins.
    # Production: add the Cloudflare Pages domain here.
    CORS_ORIGINS: str = "http://localhost:5173"

    # ── Runtime environment ───────────────────────────────────────────────────
    ENV: str = "development"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors(cls, v: str) -> str:
        return v  # kept as string; parsed to list via property below

    @property
    def cors_origins_list(self) -> List[str]:
        """Return CORS_ORIGINS split on commas, stripped of whitespace."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
