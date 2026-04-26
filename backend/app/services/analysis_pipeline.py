"""
Background analysis pipeline: skill extraction → graph match → counterfactual.

Runs automatically after a job application is submitted so that match scores
and insights are pre-computed and ready when the candidate or admin visits the
insights page.  Results are upserted (not duplicated) so re-runs are safe.
"""

import logging
from datetime import datetime
from bson import ObjectId

from app.database import db
from app.services.skill_extractor import extract_skills
from app.services.graph_rag_engine import SkillGraphRAG
from app.services.counterfactual_engine import CounterfactualEngine

logger = logging.getLogger(__name__)


def run_full_analysis(job_id: str, resume_id: str, application_id: str) -> None:
    """
    Execute the complete analysis pipeline for one job/resume pair and persist
    all results so they can be served instantly from the cache.

    Steps
    -----
    1. Skill extraction   — skipped if already done on the resume
    2. Graph-RAG match    — upserted into ``match_results``
    3. Counterfactual     — upserted into ``counterfactual_results``
    4. Application update — ``match_score`` written back to the application doc

    Designed to run inside a FastAPI ``BackgroundTasks`` call; all exceptions
    are caught so failures never affect the HTTP response that spawned the task.
    """
    try:
        resume_obj_id = ObjectId(resume_id)
        job_obj_id = ObjectId(job_id)
    except Exception:
        logger.error("run_full_analysis: invalid IDs job_id=%s resume_id=%s", job_id, resume_id)
        return

    resume = db.resumes.find_one({"_id": resume_obj_id})
    if not resume:
        logger.error("run_full_analysis: resume not found resume_id=%s", resume_id)
        return

    job = db.jobs.find_one({"_id": job_obj_id})
    if not job:
        logger.error("run_full_analysis: job not found job_id=%s", job_id)
        return

    # ── Step 1: Skill Extraction ─────────────────────────────────────────────
    candidate_skills = resume.get("extracted_skills") or []
    if not candidate_skills:
        parsed_text = resume.get("parsed_text", "")
        if parsed_text and parsed_text.strip():
            try:
                result = extract_skills(parsed_text)
                candidate_skills = result["skills"]
                db.resumes.update_one(
                    {"_id": resume_obj_id},
                    {
                        "$set": {
                            "extracted_skills": candidate_skills,
                            "skill_extraction_method": result["method"],
                            "skills_extracted_at": datetime.utcnow(),
                        }
                    },
                )
                logger.info(
                    "run_full_analysis: extracted %d skills resume_id=%s",
                    len(candidate_skills), resume_id,
                )
            except Exception as exc:
                logger.error(
                    "run_full_analysis: skill extraction failed resume_id=%s: %s", resume_id, exc
                )
                return
        else:
            logger.warning(
                "run_full_analysis: no parsed text resume_id=%s — aborting", resume_id
            )
            return

    # ── Step 2: Graph-RAG Match ──────────────────────────────────────────────
    job_skills = job.get("required_skills") or []
    if not job_skills:
        logger.warning("run_full_analysis: job has no required_skills job_id=%s", job_id)
        return

    try:
        graph_rag = SkillGraphRAG(similarity_threshold=0.6)
        graph_rag.add_job_skills(job_id, job_skills)
        graph_rag.add_candidate_skills(resume_id, candidate_skills)
        graph_rag.connect_skills()

        match_score = graph_rag.compute_match_score()
        matched_skills = graph_rag.get_matched_skills()
        missing_skills = graph_rag.get_missing_skills()
        explainability = graph_rag.get_explainability()
    except Exception as exc:
        logger.error(
            "run_full_analysis: graph match failed job_id=%s resume_id=%s: %s",
            job_id, resume_id, exc,
        )
        return

    now = datetime.utcnow()

    db.match_results.update_one(
        {"job_id": job_id, "resume_id": resume_id},
        {
            "$set": {
                "job_id": job_id,
                "resume_id": resume_id,
                "candidate_id": resume.get("candidate_id", ""),
                "match_score": match_score,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "explainability": explainability,
                "updated_at": now,
                "source": "auto_pipeline",
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )

    # Write match_score back to the application so admin ranking works
    try:
        db.applications.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": {"match_score": match_score}},
        )
    except Exception as exc:
        logger.warning(
            "run_full_analysis: could not update application score application_id=%s: %s",
            application_id, exc,
        )

    logger.info(
        "run_full_analysis: graph match done job_id=%s resume_id=%s score=%.2f",
        job_id, resume_id, match_score,
    )

    # ── Step 3: Counterfactual Analysis ─────────────────────────────────────
    if not missing_skills:
        logger.info(
            "run_full_analysis: no missing skills, skipping counterfactual job_id=%s resume_id=%s",
            job_id, resume_id,
        )
        # Store an empty counterfactual record so the cache hit is complete
        db.counterfactual_results.update_one(
            {"job_id": job_id, "resume_id": resume_id},
            {
                "$set": {
                    "job_id": job_id,
                    "resume_id": resume_id,
                    "candidate_id": resume.get("candidate_id", ""),
                    "baseline_score": match_score,
                    "counterfactuals": [],
                    "updated_at": now,
                    "source": "auto_pipeline",
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )
        return

    try:
        engine = CounterfactualEngine(
            job_skills=job_skills,
            candidate_skills=candidate_skills,
            missing_skills=missing_skills,
            baseline_match_score=match_score,
            job_id=job_id,
            resume_id=resume_id,
        )
        counterfactuals = engine.run_counterfactuals(top_k=5)
    except Exception as exc:
        logger.error(
            "run_full_analysis: counterfactual failed job_id=%s resume_id=%s: %s",
            job_id, resume_id, exc,
        )
        return

    db.counterfactual_results.update_one(
        {"job_id": job_id, "resume_id": resume_id},
        {
            "$set": {
                "job_id": job_id,
                "resume_id": resume_id,
                "candidate_id": resume.get("candidate_id", ""),
                "baseline_score": match_score,
                "counterfactuals": counterfactuals,
                "updated_at": now,
                "source": "auto_pipeline",
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )

    logger.info(
        "run_full_analysis: pipeline complete job_id=%s resume_id=%s score=%.2f counterfactuals=%d",
        job_id, resume_id, match_score, len(counterfactuals),
    )
