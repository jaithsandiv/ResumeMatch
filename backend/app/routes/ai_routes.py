from fastapi import APIRouter, HTTPException, Depends, status
from app.database import db
from app.services.graph_rag_engine import SkillGraphRAG
from app.services.skill_extractor import extract_skills
from app.services.counterfactual_engine import CounterfactualEngine
from app.utils.auth_dependencies import get_current_user
from app.models.match_result import MatchResultDocument, MatchExplainability
from bson import ObjectId
from pydantic import BaseModel
from datetime import datetime
from typing import List
import logging

router = APIRouter()

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
        Match score and skill analysis (basic implementation)
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
    
    # Get skills
    job_skills = job.get("required_skills", [])
    candidate_skills = resume.get("extracted_skills", [])
    
    # Simple match calculation
    if not job_skills:
        match_score = 0.0
    else:
        job_set = set(s.lower() for s in job_skills)
        candidate_set = set(s.lower() for s in candidate_skills)
        matched = job_set.intersection(candidate_set)
        match_score = (len(matched) / len(job_set)) * 100 if job_set else 0.0
    
    return {
        "match_score": round(match_score, 2),
        "job_skills": job_skills,
        "candidate_skills": candidate_skills,
        "matched_skills": list(set(job_skills).intersection(set(candidate_skills))),
        "missing_skills": list(set(job_skills) - set(candidate_skills)),
        "additional_skills": list(set(candidate_skills) - set(job_skills))
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


# Request model for Graph-RAG matching
class GraphMatchRequest(BaseModel):
    job_id: str
    resume_id: str


@router.post("/graph-match")
async def graph_match_skills(
    request: GraphMatchRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Compute Graph-RAG skill matching between a job and a candidate resume.
    
    This endpoint builds a NetworkX graph connecting job skills and candidate skills,
    computes weighted similarity edges, and provides explainable matching results.
    
    **Authenticated users only** - Requires valid JWT token.
    - Admins can match any job with any resume
    - Resume owners can match their resumes with any job
    
    Args:
        request: Contains job_id and resume_id
        current_user: Authenticated user from JWT token
        
    Returns:
        Complete match result with score, matched/missing skills, and explainability
    """
    # Validate ObjectId formats
    try:
        job_obj_id = ObjectId(request.job_id)
        resume_obj_id = ObjectId(request.resume_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job_id or resume_id format"
        )
    
    # Fetch job from database
    job = db.jobs.find_one({"_id": job_obj_id})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
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
            detail="Access denied: You can only match your own resumes"
        )
    
    # Extract job skills
    job_skills = job.get("required_skills", [])
    if not job_skills:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job has no required skills defined"
        )
    
    # Extract candidate skills
    candidate_skills = resume.get("extracted_skills", [])
    if not candidate_skills:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume has no extracted skills. Please run skill extraction first."
        )
    
    # Build Graph-RAG engine for this match
    try:
        graph_rag = SkillGraphRAG(similarity_threshold=0.6)
        
        # Add skills to graph
        graph_rag.add_job_skills(request.job_id, job_skills)
        graph_rag.add_candidate_skills(request.resume_id, candidate_skills)
        
        # Connect skills based on similarity
        graph_rag.connect_skills()
        
        # Compute match results
        match_score = graph_rag.compute_match_score()
        matched_skills = graph_rag.get_matched_skills()
        missing_skills = graph_rag.get_missing_skills()
        explainability = graph_rag.get_explainability()
        
        # Store result in MongoDB
        match_result = {
            "job_id": request.job_id,
            "candidate_id": resume.get("candidate_id", ""),
            "resume_id": request.resume_id,
            "match_score": match_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "explainability": explainability,
            "created_at": datetime.utcnow()
        }
        
        result = db.match_results.insert_one(match_result)
        
        # Log the match
        logger.info(
            f"Graph-RAG match computed - Job: {request.job_id}, Resume: {request.resume_id}, "
            f"Score: {match_score}, Matched: {len(matched_skills)}, Missing: {len(missing_skills)}, "
            f"User: {current_user['id']}"
        )
        
        return {
            "job_id": request.job_id,
            "candidate_id": resume.get("candidate_id", ""),
            "resume_id": request.resume_id,
            "match_score": match_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "explainability": explainability,
            "message": f"Match computed successfully with score {match_score}%"
        }
    
    except Exception as e:
        logger.error(f"Graph-RAG matching failed for job {request.job_id} and resume {request.resume_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Graph matching failed. Please try again later."
        )


# ---------------------------------------------------------------------------
# Counterfactual Skill Improvement Analysis
# ---------------------------------------------------------------------------

class CounterfactualRequest(BaseModel):
    job_id: str
    resume_id: str


@router.post("/counterfactual-analysis")
async def counterfactual_analysis(
    request: CounterfactualRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Counterfactual Skill Improvement Reasoning.

    Answers the question: "If the candidate improves skill X, how much would
    their match score increase?"

    The endpoint fetches the latest Graph-RAG match result for the given
    job/resume pair, runs the CounterfactualEngine to simulate skill additions,
    persists the results in MongoDB (`counterfactual_results`), and returns
    counterfactuals ranked by score improvement.

    **Access control**
    - Admins can request analysis for any resume.
    - Candidates can only request analysis for their own resumes.

    Args:
        request: Contains `job_id` and `resume_id`.
        current_user: Authenticated user from JWT token.

    Returns:
        Ranked counterfactual improvements with actionable advice.

    Raises:
        400: Invalid ID format or bad inputs.
        403: Caller is not the resume owner or an admin.
        404: Job, resume, or prior match result not found.
        500: Unexpected internal error.
    """
    # ------------------------------------------------------------------
    # 1. Validate ObjectId formats
    # ------------------------------------------------------------------
    try:
        job_obj_id = ObjectId(request.job_id)
        resume_obj_id = ObjectId(request.resume_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job_id or resume_id format"
        )

    # ------------------------------------------------------------------
    # 2. Fetch job
    # ------------------------------------------------------------------
    job = db.jobs.find_one({"_id": job_obj_id})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # ------------------------------------------------------------------
    # 3. Fetch resume
    # ------------------------------------------------------------------
    resume = db.resumes.find_one({"_id": resume_obj_id})
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )

    # ------------------------------------------------------------------
    # 4. Access control: admin OR resume owner only
    # ------------------------------------------------------------------
    is_admin = current_user.get("role") == "admin"
    is_owner = resume.get("candidate_id") == current_user["id"]

    if not (is_admin or is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you can only request counterfactual analysis for your own resumes"
        )

    # ------------------------------------------------------------------
    # 5. Fetch latest Graph-RAG match result for this job/resume pair
    # ------------------------------------------------------------------
    match_result = db.match_results.find_one(
        {"job_id": request.job_id, "resume_id": request.resume_id},
        sort=[("created_at", -1)]      # most recent first
    )

    if not match_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No Graph-RAG match result found for this job/resume pair. "
                "Please run /ai/graph-match first."
            )
        )

    # ------------------------------------------------------------------
    # 6. Extract fields from match result
    # ------------------------------------------------------------------
    job_skills: List[str] = match_result.get("matched_skills", []) + match_result.get("missing_skills", [])
    # Prefer the skills stored on the documents themselves for accuracy
    job_skills = job.get("required_skills") or job_skills
    candidate_skills: List[str] = resume.get("extracted_skills", [])
    missing_skills: List[str] = match_result.get("missing_skills", [])
    baseline_score: float = float(match_result.get("match_score", 0.0))

    if not isinstance(missing_skills, list):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Match result contains invalid missing_skills field"
        )

    # ------------------------------------------------------------------
    # 7. Handle empty missing skills early (no work to do)
    # ------------------------------------------------------------------
    if not missing_skills:
        logger.info(
            "Counterfactual analysis: no missing skills — job_id=%s resume_id=%s",
            request.job_id, request.resume_id
        )
        return {
            "job_id": request.job_id,
            "resume_id": request.resume_id,
            "baseline_score": baseline_score,
            "counterfactuals": [],
            "message": "No missing skills found — the candidate already matches all job requirements."
        }

    # ------------------------------------------------------------------
    # 8. Run counterfactual engine
    # ------------------------------------------------------------------
    try:
        engine = CounterfactualEngine(
            job_skills=job_skills,
            candidate_skills=candidate_skills,
            missing_skills=missing_skills,
            baseline_match_score=baseline_score,
            job_id=request.job_id,
            resume_id=request.resume_id,
        )
        counterfactuals = engine.run_counterfactuals(top_k=5)
    except Exception as exc:
        logger.error(
            "CounterfactualEngine error — job_id=%s resume_id=%s: %s",
            request.job_id, request.resume_id, exc
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Counterfactual analysis failed. Please try again later."
        )

    # ------------------------------------------------------------------
    # 9. Persist results in MongoDB counterfactual_results collection
    # ------------------------------------------------------------------
    candidate_id = resume.get("candidate_id", "")
    persistence_doc = {
        "job_id": request.job_id,
        "candidate_id": candidate_id,
        "resume_id": request.resume_id,
        "baseline_score": baseline_score,
        "counterfactuals": [
            {
                "skill": cf["skill"],
                "score_delta": cf["score_delta"],
                "new_score": cf["new_match_score"],
                "improvement_action": cf["improvement_action"],
            }
            for cf in counterfactuals
        ],
        "created_at": datetime.utcnow(),
    }

    try:
        db.counterfactual_results.insert_one(persistence_doc)
    except Exception as exc:
        # Non-fatal: log and continue rather than failing the response
        logger.error(
            "Failed to persist counterfactual results — job_id=%s resume_id=%s: %s",
            request.job_id, request.resume_id, exc
        )

    # ------------------------------------------------------------------
    # 10. Log summary
    # ------------------------------------------------------------------
    logger.info(
        "Counterfactual analysis complete — job_id=%s resume_id=%s "
        "baseline_score=%.2f counterfactuals_generated=%d user=%s",
        request.job_id, request.resume_id,
        baseline_score, len(counterfactuals),
        current_user["id"]
    )

    # ------------------------------------------------------------------
    # 11. Return ranked counterfactuals
    # ------------------------------------------------------------------
    return {
        "job_id": request.job_id,
        "resume_id": request.resume_id,
        "candidate_id": candidate_id,
        "baseline_score": baseline_score,
        "counterfactuals": counterfactuals,
        "message": (
            f"Counterfactual analysis complete. "
            f"{len(counterfactuals)} skill improvement(s) ranked by impact."
        )
    }
