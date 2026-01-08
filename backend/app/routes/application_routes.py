from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.database import db
from app.utils.auth_dependencies import get_current_user
from datetime import datetime

router = APIRouter()


@router.post("/apply")
async def apply_to_job(
    application_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a job application.
    
    **Authenticated users only** - Requires valid JWT token.
    Candidate ID is automatically taken from the JWT token.
    
    Expected payload:
    {
        "job_id": "job_id_here",
        "resume_id": "resume_id_here",
        "cover_letter": "Optional cover letter text"
    }
    """
    job_id = application_data.get("job_id")
    resume_id = application_data.get("resume_id")
    
    if not job_id or not resume_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="job_id and resume_id are required"
        )
    
    # Validate and convert job_id
    try:
        job_object_id = ObjectId(job_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job_id format"
        )
    
    # Validate and convert resume_id
    try:
        resume_object_id = ObjectId(resume_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid resume_id format"
        )
    
    # Verify job exists and is active
    job = db.jobs.find_one({"_id": job_object_id})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This job is no longer active"
        )
    
    # Verify resume exists and belongs to the current user
    resume = db.resumes.find_one({"_id": resume_object_id})
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    if resume.get("candidate_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only apply with your own resume"
        )
    
    # Check if user has already applied for this job
    existing_application = db.applications.find_one({
        "job_id": str(job_object_id),
        "candidate_id": current_user["id"]
    })
    
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this job"
        )
    
    # Create application document
    # Candidate ID comes ONLY from the JWT token
    application_doc = {
        "job_id": str(job_object_id),
        "candidate_id": current_user["id"],  # From JWT token
        "candidate_email": current_user["email"],
        "resume_id": str(resume_object_id),
        "cover_letter": application_data.get("cover_letter", ""),
        "applied_at": datetime.utcnow(),
        "status": "pending",
        "match_score": None  # Will be populated by AI service
    }
    
    result = db.applications.insert_one(application_doc)
    
    return {
        "message": "Application submitted successfully",
        "application_id": str(result.inserted_id),
        "job_id": str(job_object_id),
        "candidate_id": current_user["id"],
        "status": "pending"
    }
