"""Configuration centralisée; les secrets viennent de l'environnement ou de backend/.env."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def _bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
IS_PRODUCTION = APP_ENV == "production"
MONGODB_URI = os.getenv("MONGODB_URI", "").strip()
DATABASE_NAME = os.getenv("DATABASE_NAME", "GestionEmploye").strip()
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
JWT_SECRET = os.getenv("JWT_SECRET", "")
ALGORITHM = "HS256"
AUTH_DEV_MODE = _bool("AUTH_DEV_MODE", default=not IS_PRODUCTION) and not IS_PRODUCTION
SEED_DEMO_DATA = _bool("SEED_DEMO_DATA", default=AUTH_DEV_MODE) and not IS_PRODUCTION
ALLOW_IN_MEMORY_FALLBACK = _bool("ALLOW_IN_MEMORY_FALLBACK", default=not IS_PRODUCTION) and not IS_PRODUCTION

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    ).split(",")
    if origin.strip()
]
if IS_PRODUCTION and (not CORS_ORIGINS or "*" in CORS_ORIGINS):
    raise RuntimeError("CORS_ORIGINS doit contenir des origines explicites en production.")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "")
OPENROUTER_URL = os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1")
HF_TOKEN = os.getenv("HF_TOKEN", "")
HF_CHAT_MODEL = os.getenv("HF_CHAT_MODEL", "Qwen/Qwen3-4B-Instruct-2507")
HF_API_URL = os.getenv("HF_API_URL", "https://router.huggingface.co/v1")

RAG_EMBEDDING_MODEL = os.getenv("RAG_EMBEDDING_MODEL", "text-embedding-3-small")
RAG_MODEL = os.getenv("RAG_MODEL", OPENAI_MODEL)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "")
SMTP_STARTTLS = _bool("SMTP_STARTTLS", True)
SMTP_TIMEOUT_SECONDS = float(os.getenv("SMTP_TIMEOUT_SECONDS", "10"))
HR_NOTIFICATION_TO = os.getenv("HR_NOTIFICATION_TO", "")
SMTP_ALLOWED_RECIPIENTS = [
    value.strip().casefold()
    for value in os.getenv("SMTP_ALLOWED_RECIPIENTS", HR_NOTIFICATION_TO).split(",")
    if value.strip()
]

ACCESS_TOKEN_TTL_MINUTES = int(os.getenv("ACCESS_TOKEN_TTL_MINUTES", "60"))
