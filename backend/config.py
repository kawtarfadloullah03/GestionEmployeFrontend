import os

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://DB_USER:DB_PASS@cluster0.tptzss3.mongodb.net/?retryWrites=true&w=majority"
)
DATABASE_NAME = os.getenv("DATABASE_NAME", "GestionEmploye")
JWT_SECRET = os.getenv("JWT_SECRET", "REDACTED_JWT_SECRET")
ALGORITHM = "HS256"
