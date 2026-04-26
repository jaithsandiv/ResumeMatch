from fastapi import APIRouter, HTTPException, Depends, status, Header
from app.database import db
from app.services.graph_rag_engine import SkillGraphRAG
from app.services.skill_extractor import extract_skills
from app.services.counterfactual_engine import CounterfactualEngine
from app.utils.auth_dependencies import get_current_user
from app.models.match_result import MatchResultDocument, MatchExplainability
from app.config import N8N_SHARED_SECRET
from bson import ObjectId
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
import logging

router = APIRouter()

# Configure logging
logger = logging.getLogger(__name__)


@router.get("/analysis/{job_id}/{resume_id}")
async def get_cached_analysis(
    job_id: str,
    resume_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Return pre-computed match and counterfactual results for a job/resume pair.

    Returns 404 when the analysis has not been run yet (background pipeline
    still in progress or never triggered).  The frontend uses this to skip the
    live pipeline when results are already available.
    """
    try:
        resume_obj_id = ObjectId(resume_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid resume_id format")

    resume = db.resumes.find_one({"_id": resume_obj_id})
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    is_owner = resume.get("candidate_id") == current_user["id"]
    is_admin = current_user.get("role") == "admin"
    if not (is_owner or is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    match_result = db.match_results.find_one(
        {"job_id": job_id, "resume_id": resume_id},
        sort=[("created_at", -1)],
    )
    if not match_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No cached analysis found for this job/resume pair",
        )

    counterfactual = db.counterfactual_results.find_one(
        {"job_id": job_id, "resume_id": resume_id},
        sort=[("created_at", -1)],
    )

    return {
        "job_id": job_id,
        "resume_id": resume_id,
        "match_score": match_result.get("match_score"),
        "matched_skills": match_result.get("matched_skills", []),
        "missing_skills": match_result.get("missing_skills", []),
        "explainability": match_result.get("explainability", []),
        "baseline_score": counterfactual.get("baseline_score") if counterfactual else None,
        "counterfactuals": counterfactual.get("counterfactuals") if counterfactual else None,
    }


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
        
        # Upsert result so re-runs overwrite stale data instead of duplicating
        now = datetime.utcnow()
        db.match_results.update_one(
            {"job_id": request.job_id, "resume_id": request.resume_id},
            {
                "$set": {
                    "job_id": request.job_id,
                    "candidate_id": resume.get("candidate_id", ""),
                    "resume_id": request.resume_id,
                    "match_score": match_score,
                    "matched_skills": matched_skills,
                    "missing_skills": missing_skills,
                    "explainability": explainability,
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )
        
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
        # Upsert so re-runs replace stale data instead of duplicating
        db.counterfactual_results.update_one(
            {"job_id": request.job_id, "resume_id": request.resume_id},
            {
                "$set": persistence_doc,
                "$setOnInsert": {"created_at": persistence_doc["created_at"]},
            },
            upsert=True,
        )
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


# ---------------------------------------------------------------------------
# n8n callback endpoint
# ---------------------------------------------------------------------------

class N8nCallbackPayload(BaseModel):
    resume_id: str
    job_id: str
    match_score: float
    missing_skills: List[str] = []
    counterfactuals: List[dict] = []
    explainability: List[dict] = []
    application_id: Optional[str] = None
    candidate_id: Optional[str] = None


@router.post("/n8n/callback", status_code=status.HTTP_200_OK)
async def n8n_callback(
    payload: N8nCallbackPayload,
    x_n8n_secret: Optional[str] = Header(default=None, alias="X-N8N-SECRET"),
):
    """
    Receive workflow results posted back by n8n.

    **Internal endpoint** — requests must carry the shared secret in the
    ``X-N8N-SECRET`` header.  The secret is read from ``N8N_SHARED_SECRET``
    in the environment.

    n8n sends::

        {
          "resume_id":       "...",
          "job_id":          "...",
          "match_score":     <number>,
          "missing_skills":  [...],
          "counterfactuals": [...]
        }

    FastAPI stores the results in ``match_results`` and
    ``counterfactual_results`` collections.
    """
    # ------------------------------------------------------------------
    # 1. Authenticate the internal caller via shared secret
    # ------------------------------------------------------------------
    if N8N_SHARED_SECRET:
        if x_n8n_secret != N8N_SHARED_SECRET:
            logger.warning(
                "n8n callback rejected — invalid or missing X-N8N-SECRET "
                "for resume_id=%s job_id=%s",
                payload.resume_id, payload.job_id,
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing X-N8N-SECRET header",
            )

    logger.info(
        "n8n callback received — resume_id=%s job_id=%s match_score=%.2f",
        payload.resume_id, payload.job_id, payload.match_score,
    )

    # ------------------------------------------------------------------
    # 1b. Validate that resume and job exist in MongoDB
    # ------------------------------------------------------------------
    try:
        resume_obj_id = ObjectId(payload.resume_id)
        job_obj_id = ObjectId(payload.job_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid resume_id or job_id format",
        )

    if not db.resumes.find_one({"_id": resume_obj_id}):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume not found: {payload.resume_id}",
        )

    if not db.jobs.find_one({"_id": job_obj_id}):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job not found: {payload.job_id}",
        )

    now = datetime.utcnow()

    # Resolve candidate_id from the resume document if the workflow didn't include it
    resume_doc = db.resumes.find_one({"_id": resume_obj_id})
    candidate_id = payload.candidate_id or (resume_doc.get("candidate_id", "") if resume_doc else "")

    # ------------------------------------------------------------------
    # 2. Persist match result (upsert to avoid duplicates with the local
    #    background pipeline writing to the same job_id/resume_id pair)
    # ------------------------------------------------------------------
    match_set = {
        "resume_id": payload.resume_id,
        "job_id": payload.job_id,
        "candidate_id": candidate_id,
        "match_score": payload.match_score,
        "missing_skills": payload.missing_skills,
        "explainability": payload.explainability,
        "source": "n8n_callback",
        "updated_at": now,
    }

    try:
        db.match_results.update_one(
            {"job_id": payload.job_id, "resume_id": payload.resume_id},
            {"$set": match_set, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )
        logger.info(
            "Match result stored — resume_id=%s job_id=%s",
            payload.resume_id, payload.job_id,
        )
    except Exception as exc:
        logger.error(
            "Failed to store match result — resume_id=%s job_id=%s error=%s",
            payload.resume_id, payload.job_id, exc,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store match result",
        )

    # ------------------------------------------------------------------
    # 2b. Write the score back to the application doc when supplied so the
    #     admin applicants ranking reflects the n8n result.
    # ------------------------------------------------------------------
    if payload.application_id:
        try:
            db.applications.update_one(
                {"_id": ObjectId(payload.application_id)},
                {"$set": {"match_score": payload.match_score}},
            )
        except Exception as exc:
            logger.warning(
                "Could not update application score — application_id=%s error=%s",
                payload.application_id, exc,
            )

    # ------------------------------------------------------------------
    # 3. Persist counterfactual results (if present)
    # ------------------------------------------------------------------
    if payload.counterfactuals:
        cf_set = {
            "resume_id": payload.resume_id,
            "job_id": payload.job_id,
            "candidate_id": candidate_id,
            "baseline_score": payload.match_score,
            "counterfactuals": payload.counterfactuals,
            "source": "n8n_callback",
            "updated_at": now,
        }

        try:
            db.counterfactual_results.update_one(
                {"job_id": payload.job_id, "resume_id": payload.resume_id},
                {"$set": cf_set, "$setOnInsert": {"created_at": now}},
                upsert=True,
            )
            logger.info(
                "Counterfactual results stored — resume_id=%s job_id=%s count=%d",
                payload.resume_id, payload.job_id, len(payload.counterfactuals),
            )
        except Exception as exc:
            logger.error(
                "Failed to store counterfactual results — resume_id=%s job_id=%s error=%s",
                payload.resume_id, payload.job_id, exc,
            )
            # Non-fatal — match result already saved; log and continue.

    return {
        "status": "ok",
        "resume_id": payload.resume_id,
        "job_id": payload.job_id,
        "stored_at": now.isoformat(),
    }
