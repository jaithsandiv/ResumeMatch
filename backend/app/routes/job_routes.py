from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.database import db
from app.utils.auth_dependencies import (
    get_current_admin,
    is_system_admin,
    assert_can_manage_job,
)
from datetime import datetime

router = APIRouter()


def _serialize_job(job: dict, applicant_count: int = 0) -> dict:
    job["_id"] = str(job["_id"])
    if "created_at" in job and hasattr(job["created_at"], "isoformat"):
        job["created_at"] = job["created_at"].isoformat()
    if "created_by" in job and job["created_by"] is not None:
        job["created_by"] = str(job["created_by"])
    job["applicant_count"] = applicant_count
    return job


def _applicant_counts(job_ids: list[str]) -> dict[str, int]:
    if not job_ids:
        return {}
    cursor = db.applications.aggregate([
        {"$match": {"job_id": {"$in": job_ids}}},
        {"$group": {"_id": "$job_id", "count": {"$sum": 1}}},
    ])
    return {c["_id"]: c["count"] for c in cursor}


def _get_job_or_404(job_id: str) -> dict:
    """Resolve a job document by id or raise 400/404."""
    try:
        job_object_id = ObjectId(job_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format",
        )

    job = db.jobs.find_one({"_id": job_object_id})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    return job


@router.get("/")
async def list_jobs():
    """
    Get all active job postings.

    Public endpoint — no authentication required.  Used by the candidate-facing
    job board.  Admin-scoped listing (filtered by ownership) lives at
    ``GET /jobs/admin/list``.
    """
    jobs = list(db.jobs.find({"status": "active"}))

    counts_map = _applicant_counts([str(j["_id"]) for j in jobs])

    serialized = [_serialize_job(job, counts_map.get(str(job["_id"]), 0)) for job in jobs]

    return {"jobs": serialized, "total": len(serialized)}


@router.get("/admin/list")
async def list_admin_jobs(current_admin: dict = Depends(get_current_admin)):
    """
    List job postings the current admin is allowed to manage.

    - Regular admins: only jobs they personally created (filtered at the query
      level via ``created_by``).
    - System administrators: every job in the database.
    """
    query: dict = {} if is_system_admin(current_admin) else {"created_by": current_admin["id"]}
    jobs = list(db.jobs.find(query))

    counts_map = _applicant_counts([str(j["_id"]) for j in jobs])

    serialized = [_serialize_job(job, counts_map.get(str(job["_id"]), 0)) for job in jobs]

    return {"jobs": serialized, "total": len(serialized)}


@router.get("/admin/{job_id}")
async def get_admin_job(job_id: str, current_admin: dict = Depends(get_current_admin)):
    """Return a single job for admin management views, enforcing ownership."""
    job = _get_job_or_404(job_id)
    assert_can_manage_job(current_admin, job)

    counts_map = _applicant_counts([str(job["_id"])])
    return {"job": _serialize_job(job, counts_map.get(str(job["_id"]), 0))}


@router.post("/")
async def create_job(job_data: dict, current_admin: dict = Depends(get_current_admin)):
    """
    Create a new job posting.  The current admin is recorded as the owner.
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
        "status": job_data.get("status", "active"),
    }

    result = db.jobs.insert_one(job_doc)

    return {
        "message": "Job created successfully",
        "job_id": str(result.inserted_id),
        "title": job_data.get("title"),
        "created_by": current_admin["id"],
    }


@router.put("/{job_id}")
async def update_job(job_id: str, job_data: dict, current_admin: dict = Depends(get_current_admin)):
    """Update an existing job posting.  Only the owner or a system admin may edit."""
    existing_job = _get_job_or_404(job_id)
    assert_can_manage_job(current_admin, existing_job)

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

    db.jobs.update_one(
        {"_id": existing_job["_id"]},
        {"$set": update_data}
    )

    return {
        "message": "Job updated successfully",
        "job_id": job_id,
    }


@router.delete("/{job_id}")
async def delete_job(job_id: str, current_admin: dict = Depends(get_current_admin)):
    """Delete a job posting.  Only the owner or a system admin may delete."""
    existing_job = _get_job_or_404(job_id)
    assert_can_manage_job(current_admin, existing_job)

    db.jobs.delete_one({"_id": existing_job["_id"]})

    return {
        "message": "Job deleted successfully",
        "job_id": job_id,
    }
