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

# n8n shared secret for callback authentication
N8N_SHARED_SECRET = os.getenv("N8N_SHARED_SECRET", "")

# CORS configuration
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

# OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ---------------------------------------------------------------------------
# Backblaze B2 (S3-compatible) configuration
# ---------------------------------------------------------------------------
B2_ENDPOINT = os.getenv("B2_ENDPOINT", "")
B2_BUCKET_NAME = os.getenv("B2_BUCKET_NAME", "")
B2_ACCESS_KEY_ID = os.getenv("B2_ACCESS_KEY_ID", "")
B2_SECRET_ACCESS_KEY = os.getenv("B2_SECRET_ACCESS_KEY", "")
B2_REGION = os.getenv("B2_REGION", "us-east-005")
B2_UPLOAD_PREFIX = os.getenv("B2_UPLOAD_PREFIX", "resumes/")
