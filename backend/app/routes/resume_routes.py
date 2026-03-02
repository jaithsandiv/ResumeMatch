from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from app.database import db
from app.utils.auth_dependencies import get_current_user
from app.services.resume_parser import extract_text
from app.services.n8n_trigger import trigger_n8n_workflow
from datetime import datetime
from bson import ObjectId
import os
import shutil
import logging

router = APIRouter()

# Configure logging
logger = logging.getLogger(__name__)

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a resume file and store metadata in MongoDB.
    
    **Authenticated users only** - Requires valid JWT token.
    
    Args:
        file: The uploaded resume file (PDF, DOCX, etc.)
        current_user: Authenticated user from JWT token
        
    Returns:
        Resume metadata including file path and database ID
    """
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    # Validate file type (optional but recommended)
    allowed_extensions = [".pdf", ".docx"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Only PDF and DOCX files are supported."
        )
    
    # Generate unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{current_user['id']}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Save file to disk
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Parse resume text
    parsed_text = ""
    parse_status = "failed"
    
    try:
        parsed_text = extract_text(file_path)
        parse_status = "success"
        logger.info(f"Successfully parsed resume: {safe_filename}")
    except Exception as parse_error:
        logger.error(f"Failed to parse resume {safe_filename}: {str(parse_error)}")
        # Don't crash the request, just log the error
    
    # Store metadata in MongoDB
    resume_doc = {
        "candidate_id": current_user["id"],  # Use ID from JWT token
        "candidate_email": current_user["email"],
        "filename": file.filename,
        "file_path": file_path,
        "file_size": os.path.getsize(file_path),
        "content_type": file.content_type,
        "parsed_text": parsed_text,
        "parse_status": parse_status,
        "uploaded_at": datetime.utcnow(),
        "status": "uploaded"
    }
    
    result = db.resumes.insert_one(resume_doc)

    # Fire-and-forget: notify n8n that a resume has been uploaded and parsed.
    # This call is non-blocking; any exception inside trigger_n8n_workflow is
    # caught and logged so FastAPI remains responsive if n8n is offline.
    trigger_n8n_workflow(
        "resume_uploaded",
        {
            "resume_id": str(result.inserted_id),
            "candidate_id": current_user["id"],
        },
    )

    response = {
        "message": "Resume uploaded successfully",
        "resume_id": str(result.inserted_id),
        "filename": file.filename,
        "candidate_id": current_user["id"],
        "parse_status": parse_status
    }
    
    # Add warning if parsing failed
    if parse_status == "failed":
        response["warning"] = "Resume uploaded but text extraction failed"
    
    return response


@router.get("/{resume_id}/text")
async def get_resume_text(
    resume_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get parsed text from a resume for debugging purposes.
    
    **Authenticated users only** - Requires valid JWT token.
    Users can only access their own resumes.
    
    Args:
        resume_id: The MongoDB ObjectId of the resume
        current_user: Authenticated user from JWT token
        
    Returns:
        Resume parse status and text preview (first 1000 characters)
    """
    # Validate ObjectId format
    try:
        resume_obj_id = ObjectId(resume_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid resume ID format"
        )
    
    # Fetch resume from database
    resume = db.resumes.find_one({"_id": resume_obj_id})
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    # Ensure resume belongs to current user
    if resume.get("candidate_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only view your own resumes"
        )
    
    # Get parsed text and prepare preview
    parsed_text = resume.get("parsed_text", "")
    text_preview = parsed_text[:1000] if parsed_text else ""
    
    return {
        "resume_id": resume_id,
        "parse_status": resume.get("parse_status", "unknown"),
        "text_preview": text_preview,
        "total_characters": len(parsed_text)
    }
