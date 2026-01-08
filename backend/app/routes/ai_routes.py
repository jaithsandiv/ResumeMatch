from fastapi import APIRouter, HTTPException, Depends, status
from app.database import db
from app.services.graph_rag_engine import SkillGraphRAG
from app.services.skill_extractor import extract_skills
from app.utils.auth_dependencies import get_current_user
from bson import ObjectId
from pydantic import BaseModel
from datetime import datetime
import logging

router = APIRouter()
graph_rag = SkillGraphRAG()

# Configure logging
logger = logging.getLogger(__name__)


@router.post("/match-preview")
async def match_preview(match_data: dict):
    """
    Preview match score between a candidate and a job.
    
    Expected payload:
    {
        "job_id": "job_id_here",
        "resume_id": "resume_id_here"
    }
    
    Returns:
        Match score and skill analysis (placeholder implementation)
    """
    job_id = match_data.get("job_id")
    resume_id = match_data.get("resume_id")
    
    if not job_id or not resume_id:
        raise HTTPException(
            status_code=400,
            detail="Both job_id and resume_id are required"
        )
    
    # Fetch job from database
    job = db.jobs.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Fetch resume from database
    resume = db.resumes.find_one({"_id": resume_id})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Use Graph-RAG engine to compute match
    job_skills = job.get("required_skills", [])
    candidate_skills = []  # In real implementation, extract from resume
    
    match_score = graph_rag.compute_match_score(job_skills, candidate_skills)
    
    return {
        "match_score": match_score,
        "job_skills": job_skills,
        "candidate_skills": candidate_skills,
        "matched_skills": [],
        "missing_skills": job_skills,
        "additional_skills": []
    }


# Request model for skill extraction
class SkillExtractionRequest(BaseModel):
    resume_id: str


@router.post("/skill-extraction")
async def extract_resume_skills(
    request: SkillExtractionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Extract professional skills from a resume using LLM with keyword fallback.
    
    **Authenticated users only** - Requires valid JWT token.
    Users can extract skills from their own resumes, or admins can extract from any resume.
    
    Args:
        request: Contains resume_id to extract skills from
        current_user: Authenticated user from JWT token
        
    Returns:
        Extracted skills, method used, and metadata
    """
    # Validate ObjectId format
    try:
        resume_obj_id = ObjectId(request.resume_id)
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
    
    # Check access control
    is_owner = resume.get("candidate_id") == current_user["id"]
    is_admin = current_user.get("role") == "admin"
    
    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only extract skills from your own resumes"
        )
    
    # Validate parsed text exists
    parsed_text = resume.get("parsed_text", "")
    
    if not parsed_text or not parsed_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume has no parsed text. Please ensure the resume was successfully parsed."
        )
    
    # Extract skills
    try:
        extraction_result = extract_skills(parsed_text)
        
        skills = extraction_result["skills"]
        method = extraction_result["method"]
        
        # Update resume document in MongoDB
        update_result = db.resumes.update_one(
            {"_id": resume_obj_id},
            {
                "$set": {
                    "extracted_skills": skills,
                    "skill_extraction_method": method,
                    "skills_extracted_at": datetime.utcnow()
                }
            }
        )
        
        # Log the extraction
        logger.info(
            f"Extracted {len(skills)} skills from resume {request.resume_id} "
            f"using {method} method for user {current_user['id']}"
        )
        
        return {
            "resume_id": request.resume_id,
            "skills": skills,
            "skill_count": len(skills),
            "extraction_method": method,
            "message": f"Successfully extracted {len(skills)} skills using {method} method"
        }
    
    except Exception as e:
        logger.error(f"Skill extraction failed for resume {request.resume_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Skill extraction failed. Please try again later."
        )
