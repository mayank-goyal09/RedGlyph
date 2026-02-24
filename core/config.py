"""
═══════════════════════════════════════════════════════
 REDGLYPH — Configuration Management
 Centralized config with env-based API key security.
═══════════════════════════════════════════════════════
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """App-wide configuration. API keys never leave the server."""

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))

    # AI
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    DEFAULT_MODEL: str = os.getenv("MODEL_NAME", "gemini-2.5-flash")
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.1"))

    # Email
    EMAIL_ADDRESS: str = os.getenv("EMAIL_ADDRESS", "")
    EMAIL_APP_PASSWORD: str = os.getenv("EMAIL_APP_PASSWORD", "")

    # Security
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "*").split(",")

    # Audit
    AUDIT_LOG_FILE: str = os.getenv("AUDIT_LOG", "audit.log")


config = Config()
