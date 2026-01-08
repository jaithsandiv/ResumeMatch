# ResumeMatch Backend

FastAPI-based backend for the ResumeMatch AI application.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration and environment variables
│   ├── database.py          # MongoDB connection
│   ├── models/
│   │   └── __init__.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth_routes.py       # Authentication endpoints
│   │   ├── job_routes.py        # Job posting endpoints
│   │   ├── resume_routes.py     # Resume upload endpoints
│   │   ├── application_routes.py # Job application endpoints
│   │   └── ai_routes.py         # AI matching endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── graph_rag_engine.py  # NetworkX-based skill matching
│   │   └── n8n_trigger.py       # n8n webhook integration
│   ├── utils/
│   │   ├── __init__.py
│   │   └── jwt_utils.py         # JWT token utilities
│   └── schemas/
│       └── __init__.py
├── .venv/                   # Python virtual environment
├── uploads/                 # Resume file storage
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment variable template
├── .gitignore              # Git ignore rules
├── seed_admin.py           # Admin user seeding script
└── test_endpoints.py       # API endpoint testing script
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/resumematch
JWT_SECRET=your-secure-random-secret-key
N8N_WEBHOOK_URL=http://localhost:5678/webhook/resume-uploaded
FRONTEND_ORIGIN=http://localhost:3000
ADMIN_PASSWORD=your-admin-password
```

### 2. Install Dependencies

The virtual environment is already created. All dependencies are installed and listed in `requirements.txt`.

### 3. Run Database Seeding

Create the default admin user:

```bash
python seed_admin.py
```

This creates an admin user with:
- Email: `admin@example.com`
- Password: Value from `ADMIN_PASSWORD` environment variable
- Role: `admin`

### 4. Start the Server

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Or use the full path:
```bash
.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

### 5. Access the API

- **API Documentation (Swagger UI)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/
- **MongoDB Health**: http://localhost:8000/health/mongo

## API Endpoints

### Authentication (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

### Jobs (`/jobs`)
- `GET /jobs/` - List all job postings
- `POST /jobs/` - Create new job posting

### Resumes (`/resumes`)
- `POST /resumes/upload` - Upload resume file

### Applications (`/applications`)
- `POST /applications/apply` - Submit job application

### AI Matching (`/ai`)
- `POST /ai/match-preview` - Preview match score between candidate and job

## Features Implemented

✅ **FastAPI Application**
- CORS middleware configured for frontend origin
- All routers included and organized
- Swagger UI auto-generated documentation

✅ **MongoDB Atlas Integration**
- PyMongo client with connection validation
- Database name: `resumematch`
- Error handling for missing MONGO_URI

✅ **Authentication**
- JWT token creation with 7-day expiry
- HS256 algorithm
- Bcrypt password hashing
- User registration and login endpoints

✅ **File Upload**
- Resume upload to `/uploads` directory
- File metadata stored in MongoDB
- Proper error handling

✅ **Graph-RAG Engine**
- NetworkX-based skill graph
- Skill matching algorithm
- Job and candidate skill analysis

✅ **n8n Integration**
- Webhook trigger function
- Graceful failure handling (doesn't crash if n8n is offline)
- Configurable webhook URL

✅ **Security**
- No hardcoded secrets
- Environment variable configuration
- `.gitignore` configured properly

## Testing

Run the test script to verify all endpoints:

```bash
python test_endpoints.py
```

## Database Collections

The following MongoDB collections are used:

- **users** - User accounts (candidates, recruiters, admins)
- **jobs** - Job postings
- **resumes** - Resume files and metadata
- **applications** - Job applications with match scores

## Dependencies

All dependencies are listed in `requirements.txt`:

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pymongo` - MongoDB driver
- `python-dotenv` - Environment variable management
- `python-jose[cryptography]` - JWT token handling
- `passlib[bcrypt]` - Password hashing
- `python-multipart` - File upload support
- `requests` - HTTP client for n8n webhooks
- `networkx` - Graph-based skill matching

## Notes

- Ensure MongoDB Atlas connection string is properly configured in `.env`
- The admin seeding script should be run once after initial setup
- Resume files are stored in the `uploads/` directory (not tracked by git)
- The n8n webhook integration will log errors but won't crash the application if n8n is unavailable
- All routes currently have basic implementations - expand as needed for production
