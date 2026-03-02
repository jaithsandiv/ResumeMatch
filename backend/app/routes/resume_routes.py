"""
Resume routes: upload, parse, download-URL, and text preview.

All file storage is delegated to Backblaze B2 via StorageService.
No local file paths are stored in MongoDB.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from app.database import db
from app.utils.auth_dependencies import get_current_user
from app.services.resume_parser import extract_text
from app.services.storage_service import StorageService
from app.services.n8n_trigger import trigger_n8n_workflow
from app.config import B2_UPLOAD_PREFIX
from datetime import datetime
from bson import ObjectId
import os
import shutil
import logging

router = APIRouter()

logger = logging.getLogger(__name__)

# Temporary directory for transient file operations (written before B2 upload
# and when downloading for parsing).  Never stored in MongoDB.
TMP_DIR = os.path.join("uploads", "tmp")
os.makedirs(TMP_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _storage() -> StorageService:
    """Instantiate StorageService; raises 500 if B2 is not configured."""
    try:
        return StorageService()
    except RuntimeError as exc:
        logger.error("StorageService configuration error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File storage is not available. Please contact the administrator.",
        )


def _fetch_resume_with_access(resume_id: str, current_user: dict) -> dict:
    """
    Fetch a resume document from MongoDB.  Raises 400 for bad IDs, 404 if
    not found, and 403 if the caller has no access.
    """
    try:
        obj_id = ObjectId(resume_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid resume ID format.",
        )

    resume = db.resumes.find_one({"_id": obj_id})
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    is_owner = resume.get("candidate_id") == current_user["id"]
    is_admin = current_user.get("role") == "admin"
    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you can only access your own resumes.",
        )

    return resume


def _safe_delete(path: str) -> None:
    """Delete a file silently, logging any errors."""
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception as exc:
        logger.warning("Could not delete temp file %s: %s", path, exc)



# ---------------------------------------------------------------------------
# POST /resumes/upload
# ---------------------------------------------------------------------------

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a resume (PDF or DOCX), store it in Backblaze B2, and persist
    metadata + parsed text in MongoDB.

    No local file path is stored in the database — only B2 bucket/key metadata.
    """
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided",
        )

    allowed_extensions = {".pdf", ".docx"}
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are supported.",
        )

    # Build unique object key for B2
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_name = f"{timestamp}_{current_user['id']}{file_ext}"
    object_key = f"{B2_UPLOAD_PREFIX.rstrip('/')}/{safe_name}"

    # Local temp path — deleted as soon as B2 upload + parsing complete
    tmp_path = os.path.join(TMP_DIR, safe_name)

    storage = _storage()

    # ------------------------------------------------------------------
    # 1. Save the upload stream to a local temp file
    # ------------------------------------------------------------------
    try:
        with open(tmp_path, "wb") as fh:
            shutil.copyfileobj(file.file, fh)
        file_size = os.path.getsize(tmp_path)
    except Exception as exc:
        logger.error("Failed to write temp file for user=%s: %s", current_user["id"], exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to receive uploaded file.",
        )

    # ------------------------------------------------------------------
    # 2. Upload temp file to B2
    # ------------------------------------------------------------------
    b2_meta: dict = {}
    try:
        b2_meta = storage.upload_file(
            local_path=tmp_path,
            object_key=object_key,
            content_type=file.content_type,
        )
        logger.info("Resume stored in B2 — key=%s user=%s", object_key, current_user["id"])
    except Exception as exc:
        logger.error("B2 upload failed — user=%s: %s", current_user["id"], exc)
        _safe_delete(tmp_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File upload to cloud storage failed. Please try again.",
        )

    # ------------------------------------------------------------------
    # 3. Parse text from the temp file (still on disk at this point)
    # ------------------------------------------------------------------
    parsed_text = ""
    parse_status = "failed"
    try:
        parsed_text = extract_text(tmp_path)
        parse_status = "success"
        logger.info("Parsed resume text — key=%s chars=%d", object_key, len(parsed_text))
    except Exception as parse_exc:
        logger.error("Parsing failed — key=%s: %s", object_key, parse_exc)
    finally:
        _safe_delete(tmp_path)  # Always remove local temp copy

    # ------------------------------------------------------------------
    # 4. Persist metadata in MongoDB (no local paths stored)
    # ------------------------------------------------------------------
    resume_doc = {
        "user_id": current_user["id"],
        "candidate_id": current_user["id"],
        "candidate_email": current_user.get("email", ""),
        "original_filename": file.filename,
        "content_type": file.content_type,
        "file_size": file_size,
        "storage_provider": "b2",
        "b2_bucket": b2_meta.get("bucket", ""),
        "b2_object_key": object_key,
        "parse_status": parse_status,
        "parsed_text": parsed_text,
        "extracted_skills": [],
        "created_at": datetime.utcnow(),
        "status": "uploaded",
    }

    result = db.resumes.insert_one(resume_doc)
    resume_id = str(result.inserted_id)

    # ------------------------------------------------------------------
    # 5. Notify n8n (fire-and-forget, no file paths in payload)
    # ------------------------------------------------------------------
    trigger_n8n_workflow(
        "resume_uploaded",
        {
            "resume_id": resume_id,
            "candidate_id": current_user["id"],
        },
    )

    response: dict = {
        "message": "Resume uploaded successfully",
        "resume_id": resume_id,
        "filename": file.filename,
        "candidate_id": current_user["id"],
        "parse_status": parse_status,
    }

    if parse_status == "failed":
        response["warning"] = "Resume uploaded but text extraction failed."

    return response


# ---------------------------------------------------------------------------
# GET /resumes/{resume_id}/text
# ---------------------------------------------------------------------------

@router.get("/{resume_id}/text")
async def get_resume_text(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Return a preview (first 1 000 characters) of a resume's parsed text.

    The calling user must own the resume or be an admin.
    """
    resume = _fetch_resume_with_access(resume_id, current_user)

    parsed_text = resume.get("parsed_text", "")
    return {
        "resume_id": resume_id,
        "parse_status": resume.get("parse_status", "unknown"),
        "text_preview": parsed_text[:1000],
        "total_characters": len(parsed_text),
    }


# ---------------------------------------------------------------------------
# GET /resumes/{resume_id}/download-url
# ---------------------------------------------------------------------------

@router.get("/{resume_id}/download-url")
async def get_resume_download_url(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate a short-lived (10 min) pre-signed GET URL for a resume in B2.

    Only the resume owner or an admin may call this endpoint.
    No raw credentials or object keys are included in the response.

    Returns:
        ``{"resume_id": "...", "expires_in": 600, "url": "https://..."}``
    """
    resume = _fetch_resume_with_access(resume_id, current_user)

    object_key = resume.get("b2_object_key")
    if not object_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No cloud storage reference found for this resume.",
        )

    storage = _storage()
    try:
        presigned_url = storage.generate_presigned_get_url(
            object_key=object_key, expires_seconds=600
        )
    except Exception as exc:
        logger.error(
            "Presigned URL generation failed — resume_id=%s: %s", resume_id, exc
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate download URL. Please try again.",
        )

    return {
        "resume_id": resume_id,
        "expires_in": 600,
        "url": presigned_url,
    }
