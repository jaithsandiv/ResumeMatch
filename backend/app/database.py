from pymongo import MongoClient
from app.config import MONGO_URI

# Validate MONGO_URI is set
if not MONGO_URI:
    raise RuntimeError(
        "MONGO_URI environment variable is not set. "
        "Please configure it in your .env file."
    )

# Create MongoDB client
client = MongoClient(MONGO_URI)

# Select database
db = client["resumematch"]


def get_db():
    """Return the database instance."""
    return db
