"""
Internal routes — accessible only by trusted internal services (e.g. n8n).

Every endpoint here is protected by the ``X-N8N-SECRET`` header which must
match ``N8N_SHARED_SECRET`` from the environment.  No JWT is required because
n8n is a server-side automation tool, not an end-user browser.
"""

from fastapi import APIRouter, HTTPException, Header, status
from app.database import db
from app.config import N8N_SHARED_SECRET
from app.services.storage_service import StorageService
from bson import ObjectId
from pydantic import BaseModel
from typing import Literal, Optional
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class ResumeAccessRequest(BaseModel):
    resume_id: str
    mode: Literal["text", "download_url"]


# ---------------------------------------------------------------------------
# Helper: authenticate internal caller
# ---------------------------------------------------------------------------

def _require_n8n_secret(x_n8n_secret: Optional[str]) -> None:
    """
    Raise HTTP 401 if the shared secret header is missing or incorrect.
    When N8N_SHARED_SECRET is empty (dev mode without secret), allow all.
    """
    if N8N_SHARED_SECRET and x_n8n_secret != N8N_SHARED_SECRET:
        logger.warning("Internal endpoint rejected — invalid X-N8N-SECRET")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-N8N-SECRET header.",
        )


def _get_storage() -> StorageService:
    try:
        return StorageService()
    except RuntimeError as exc:
        logger.error("StorageService unavailable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File storage is not available.",
        )


# ---------------------------------------------------------------------------
# POST /internal/resumes/access
# ---------------------------------------------------------------------------

@router.post("/resumes/access")
async def internal_resume_access(
    body: ResumeAccessRequest,
    x_n8n_secret: Optional[str] = Header(default=None, alias="X-N8N-SECRET"),
):
    """
    Internal endpoint for n8n workflows to fetch resume content.

    **Security**: ``X-N8N-SECRET`` header must match ``N8N_SHARED_SECRET``.

    Modes:
    - ``"text"``         — returns the stored ``parsed_text`` (no file download needed).
    - ``"download_url"`` — returns a short-lived pre-signed GET URL from B2.

    Request body::

        {"resume_id": "<mongo_id>", "mode": "text" | "download_url"}

    Response (text mode)::

        {"resume_id": "...", "mode": "text", "parsed_text": "..."}

    Response (download_url mode)::

        {"resume_id": "...", "mode": "download_url", "expires_in": 600, "url": "https://..."}
    """
    # ------------------------------------------------------------------
    # 1. Authenticate
    # ------------------------------------------------------------------
    _require_n8n_secret(x_n8n_secret)

    # ------------------------------------------------------------------
    # 2. Validate and fetch resume from MongoDB
    # ------------------------------------------------------------------
    try:
        obj_id = ObjectId(body.resume_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid resume_id format.",
        )

    resume = db.resumes.find_one({"_id": obj_id})
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    # ------------------------------------------------------------------
    # 3. Return requested data
    # ------------------------------------------------------------------
    if body.mode == "text":
        parsed_text = resume.get("parsed_text", "")
        logger.info(
            "Internal text access — resume_id=%s chars=%d", body.resume_id, len(parsed_text)
        )
        return {
            "resume_id": body.resume_id,
            "mode": "text",
            "parsed_text": parsed_text,
        }

    # mode == "download_url"
    object_key = resume.get("b2_object_key")
    if not object_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No cloud storage reference found for this resume.",
        )

    storage = _get_storage()
    try:
        url = storage.generate_presigned_get_url(object_key=object_key, expires_seconds=600)
    except Exception as exc:
        logger.error(
            "Presigned URL generation failed (internal) — resume_id=%s: %s",
            body.resume_id,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate download URL.",
        )

    logger.info("Internal download_url issued — resume_id=%s", body.resume_id)
    return {
        "resume_id": body.resume_id,
        "mode": "download_url",
        "expires_in": 600,
        "url": url,
    }
