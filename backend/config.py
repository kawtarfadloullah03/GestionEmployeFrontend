import os

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

MONGODB_URI = os.getenv("MONGODB_URI", "")
DATABASE_NAME = os.getenv("DATABASE_NAME", "GestionEmploye")
JWT_SECRET = os.getenv("JWT_SECRET", "")
ALGORITHM = "HS256"
# Chatbot - OpenRouter (free ":free" models), fallback Hugging Face Inference Providers
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "qwen/qwen3.8-27b:free")
OPENROUTER_URL = os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1")
HF_TOKEN = os.getenv("HF_TOKEN", "")
HF_CHAT_MODEL = os.getenv("HF_CHAT_MODEL", "Qwen/Qwen3-4B-Instruct-2507")
HF_API_URL = os.getenv("HF_API_URL", "https://router.huggingface.co/v1")
