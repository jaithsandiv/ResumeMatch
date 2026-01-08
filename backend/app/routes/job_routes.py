from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.database import db
from app.utils.auth_dependencies import get_current_admin
from datetime import datetime

router = APIRouter()


@router.get("/")
async def list_jobs():
    """
    Get all job postings.
    
    Public endpoint - no authentication required.
    Returns a list of all active jobs in the database.
    """
    jobs = list(db.jobs.find({"status": "active"}))
    
    # Convert ObjectId to string for JSON serialization
    for job in jobs:
        job["_id"] = str(job["_id"])
        if "created_at" in job:
            job["created_at"] = job["created_at"].isoformat()
    
    return {
        "jobs": jobs,
        "total": len(jobs)
    }


@router.post("/")
async def create_job(job_data: dict, current_admin: dict = Depends(get_current_admin)):
    """
    Create a new job posting.
    
    **Admin only** - Requires admin role.
    
    Expected payload:
    {
        "title": "Software Engineer",
        "company": "Tech Corp",
        "description": "We are looking for...",
        "required_skills": ["Python", "FastAPI", "MongoDB"],
        "location": "Remote",
        "salary_range": "80k-120k"
    }
    """
    # Validate required fields
    if not job_data.get("title") or not job_data.get("company"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title and company are required"
        )
    
    job_doc = {
        "title": job_data.get("title"),
        "company": job_data.get("company"),
        "description": job_data.get("description", ""),
        "required_skills": job_data.get("required_skills", []),
        "location": job_data.get("location", ""),
        "salary_range": job_data.get("salary_range", ""),
        "created_by": current_admin["id"],
        "created_at": datetime.utcnow(),
        "status": "active"
    }
    
    result = db.jobs.insert_one(job_doc)
    
    return {
        "message": "Job created successfully",
        "job_id": str(result.inserted_id),
        "title": job_data.get("title")
    }


@router.put("/{job_id}")
async def update_job(job_id: str, job_data: dict, current_admin: dict = Depends(get_current_admin)):
    """
    Update an existing job posting.
    
    **Admin only** - Requires admin role.
    
    Args:
        job_id: The job ID to update
        job_data: Updated job fields
    """
    # Validate job ID
    try:
        job_object_id = ObjectId(job_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )
    
    # Check if job exists
    existing_job = db.jobs.find_one({"_id": job_object_id})
    if not existing_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Prepare update data (only update provided fields)
    update_data = {}
    allowed_fields = ["title", "company", "description", "required_skills", "location", "salary_range", "status"]
    
    for field in allowed_fields:
        if field in job_data:
            update_data[field] = job_data[field]
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update"
        )
    
    # Update the job
    db.jobs.update_one(
        {"_id": job_object_id},
        {"$set": update_data}
    )
    
    return {
        "message": "Job updated successfully",
        "job_id": job_id
    }


@router.delete("/{job_id}")
async def delete_job(job_id: str, current_admin: dict = Depends(get_current_admin)):
    """
    Delete a job posting.
    
    **Admin only** - Requires admin role.
    
    Args:
        job_id: The job ID to delete
    """
    # Validate job ID
    try:
        job_object_id = ObjectId(job_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )
    
    # Check if job exists
    existing_job = db.jobs.find_one({"_id": job_object_id})
    if not existing_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Delete the job
    db.jobs.delete_one({"_id": job_object_id})
    
    return {
        "message": "Job deleted successfully",
        "job_id": job_id
    }
