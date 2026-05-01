from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
import logging

from app.database import db
from app.utils.auth_dependencies import get_current_system_admin

router = APIRouter()
logger = logging.getLogger(__name__)


class ContactMessage(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    contact_info: str = Field(..., min_length=1, max_length=200)
    reason: str = Field(..., min_length=1, max_length=2000)


class ContactReadStatus(BaseModel):
    read: bool


def _serialize_message(doc: dict) -> dict:
    submitted = doc.get("submitted_at")
    read_at = doc.get("read_at")
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "contact_info": doc.get("contact_info", ""),
        "reason": doc.get("reason", ""),
        "read": bool(doc.get("read", False)),
        "submitted_at": submitted.isoformat() if submitted else "",
        "read_at": read_at.isoformat() if read_at else None,
    }


def _resolve_message_id(message_id: str) -> ObjectId:
    try:
        return ObjectId(message_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid message ID format",
        )


@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_contact_message(payload: ContactMessage):
    """
    Public contact form endpoint — no authentication required.

    Stores the submission in the ``contact_messages`` collection so admins can
    review them later.
    """
    name = payload.name.strip()
    contact_info = payload.contact_info.strip()
    reason = payload.reason.strip()

    if not name or not contact_info or not reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name, contact info, and reason are all required.",
        )

    doc = {
        "name": name,
        "contact_info": contact_info,
        "reason": reason,
        "read": False,
        "submitted_at": datetime.utcnow(),
    }

    try:
        result = db.contact_messages.insert_one(doc)
    except Exception as exc:
        logger.error("Failed to store contact message: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not submit message. Please try again later.",
        )

    logger.info("Contact message stored — id=%s", result.inserted_id)
    return {
        "message": "Thanks — we'll be in touch.",
        "id": str(result.inserted_id),
    }


@router.get("/admin/list")
async def list_contact_messages(_: dict = Depends(get_current_system_admin)):
    """List all contact submissions, newest first.  System admin only."""
    docs = list(db.contact_messages.find().sort("submitted_at", -1))
    unread = sum(1 for d in docs if not d.get("read", False))
    return {
        "messages": [_serialize_message(d) for d in docs],
        "total": len(docs),
        "unread": unread,
    }


@router.patch("/admin/{message_id}")
async def update_message_read_status(
    message_id: str,
    body: ContactReadStatus,
    _: dict = Depends(get_current_system_admin),
):
    """Flag a contact submission as read or unread.  System admin only."""
    oid = _resolve_message_id(message_id)
    update = {"read": body.read, "read_at": datetime.utcnow() if body.read else None}
    res = db.contact_messages.update_one({"_id": oid}, {"$set": update})
    if not res.matched_count:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
    return {"message_id": message_id, "read": body.read}


@router.delete("/admin/{message_id}")
async def delete_contact_message(
    message_id: str,
    _: dict = Depends(get_current_system_admin),
):
    """Delete a contact submission.  System admin only."""
    oid = _resolve_message_id(message_id)
    res = db.contact_messages.delete_one({"_id": oid})
    if not res.deleted_count:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
    return {"message_id": message_id, "deleted": True}
