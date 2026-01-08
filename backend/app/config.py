from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# MongoDB configuration
MONGO_URI = os.getenv("MONGO_URI")

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET")

# n8n webhook URL
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/resume-uploaded")

# CORS configuration
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

# OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
