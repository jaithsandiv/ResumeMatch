from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from bson import ObjectId
from app.database import db
from app.utils.auth_dependencies import get_current_user, get_current_admin
from app.services.n8n_trigger import trigger_n8n_workflow
from app.services.analysis_pipeline import run_full_analysis
from datetime import datetime

router = APIRouter()


@router.get("/job/{job_id}")
async def get_job_applicants(
    job_id: str,
    current_user: dict = Depends(get_current_admin),
):
    """
    Return all applicants for a job, ranked by match score (desc).

    **Admin only.**  Match scores are pulled from match_results when
    available, falling back to the score stored on the application itself.
    """
    applications = list(db.applications.find({"job_id": job_id}))

    result = []
    for app in applications:
        app_id = str(app["_id"])
        resume_id = app.get("resume_id", "")

        match = db.match_results.find_one({"job_id": job_id, "resume_id": resume_id})
        match_score = (
            match.get("match_score") if match else app.get("match_score")
        )

        applied = app.get("applied_at")
        result.append({
            "application_id": app_id,
            "candidate_id": app.get("candidate_id", ""),
            "candidate_email": app.get("candidate_email", ""),
            "resume_id": resume_id,
            "status": app.get("status", "pending"),
            "applied_at": applied.isoformat() if applied else "",
            "match_score": match_score,
        })

    result.sort(key=lambda x: (x["match_score"] is None, -(x["match_score"] or 0)))
    return {"applicants": result, "total": len(result)}


@router.patch("/{application_id}/status")
async def update_application_status(
    application_id: str,
    body: dict,
    current_user: dict = Depends(get_current_admin),
):
    """Update an application's status. **Admin only.**"""
    new_status = body.get("status")
    allowed = {"pending", "interview", "rejected"}
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status must be one of: {', '.join(sorted(allowed))}",
        )

    try:
        app_oid = ObjectId(application_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application_id format",
        )

    result = db.applications.update_one(
        {"_id": app_oid},
        {"$set": {"status": new_status, "status_updated_at": datetime.utcnow()}},
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    return {"application_id": application_id, "status": new_status}


@router.post("/apply")
async def apply_to_job(
    application_data: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
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
    application_id = str(result.inserted_id)

    # Run full analysis pipeline in the background so match scores and
    # insights are ready before the candidate visits the insights page.
    background_tasks.add_task(
        run_full_analysis,
        job_id=str(job_object_id),
        resume_id=str(resume_object_id),
        application_id=application_id,
    )

    # Also notify n8n if configured (optional, fire-and-forget).
    trigger_n8n_workflow(
        "job_applied",
        {
            "application_id": application_id,
            "job_id": str(job_object_id),
            "candidate_id": current_user["id"],
            "resume_id": str(resume_object_id),
        },
    )

    return {
        "message": "Application submitted successfully",
        "application_id": application_id,
        "job_id": str(job_object_id),
        "candidate_id": current_user["id"],
        "status": "pending",
    }
