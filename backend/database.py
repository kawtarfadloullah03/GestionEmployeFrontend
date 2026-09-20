import logging
from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGODB_URI, DATABASE_NAME

logger = logging.getLogger("uvicorn")

client = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[DATABASE_NAME]
        # Ping database to confirm connection
        await client.admin.command('ping')
        logger.info(f"Connected to MongoDB Atlas: {DATABASE_NAME}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        # DB will stay none or attempt fallback in memory if needed
        db = None

async def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed.")

def get_db():
    return db
