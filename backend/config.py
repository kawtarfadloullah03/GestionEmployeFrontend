import os

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://kawtarfadloullah_db_user:a86bfyHpV21pAAWL@cluster0.tptzss3.mongodb.net/?retryWrites=true&w=majority"
)
DATABASE_NAME = os.getenv("DATABASE_NAME", "GestionEmploye")
JWT_SECRET = os.getenv("JWT_SECRET", "workflow_hr_super_secret_key_2026")
ALGORITHM = "HS256"
