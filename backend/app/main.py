from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import db
from app.config import FRONTEND_ORIGIN

# Import routers
from app.routes import auth_routes, job_routes, resume_routes, application_routes, ai_routes
from app.routes import internal_routes

# Create FastAPI application
app = FastAPI(title="ResumeMatch AI Backend")

# Configure CORS
origins = [FRONTEND_ORIGIN]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
app.include_router(job_routes.router, prefix="/jobs", tags=["Jobs"])
app.include_router(resume_routes.router, prefix="/resumes", tags=["Resumes"])
app.include_router(application_routes.router, prefix="/applications", tags=["Applications"])
app.include_router(ai_routes.router, prefix="/ai", tags=["AI"])
app.include_router(internal_routes.router, prefix="/internal", tags=["Internal"])


@app.get("/")
def root():
    """Root endpoint - health check."""
    return {
        "status": "running",
        "service": "ResumeMatch Backend"
    }


@app.get("/health/mongo")
def health_mongo():
    """MongoDB health check endpoint."""
    try:
        collection_names = db.list_collection_names()
        return {
            "status": "healthy",
            "database": db.name,
            "collections": collection_names
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
