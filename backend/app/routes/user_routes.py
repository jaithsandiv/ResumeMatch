from fastapi import APIRouter, HTTPException, status, Depends
from passlib.context import CryptContext
from bson import ObjectId
from app.database import db
from app.utils.auth_dependencies import get_current_user, get_current_admin
from app.utils.jwt_utils import create_access_token

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.put("/profile")
async def update_profile(update_data: dict, current_user: dict = Depends(get_current_user)):
    """Update current user's full_name, email, and/or password."""
    user_id = current_user["id"]

    full_name = (update_data.get("full_name") or "").strip()
    email = (update_data.get("email") or "").strip()
    current_password = (update_data.get("current_password") or "").strip()
    new_password = (update_data.get("new_password") or "").strip()

    changing_password = bool(current_password or new_password)

    if not full_name and not email and not changing_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    update_fields = {}

    if full_name:
        update_fields["full_name"] = full_name

    if email:
        existing = db.users.find_one({"email": email, "_id": {"$ne": ObjectId(user_id)}})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use by another account",
            )
        update_fields["email"] = email

    if changing_password:
        if not current_password or not new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Both current password and new password are required to change your password",
            )
        stored_user = db.users.find_one({"_id": ObjectId(user_id)})
        if not pwd_context.verify(current_password, stored_user.get("password", "")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 8 characters",
            )
        update_fields["password"] = pwd_context.hash(new_password)

    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})

    user = db.users.find_one({"_id": ObjectId(user_id)})
    token_data = {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user.get("full_name", ""),
        "role": user.get("role", "visitor"),
    }
    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "role": user.get("role", "visitor"),
        },
    }


@router.get("/admin/list")
async def list_users(current_admin: dict = Depends(get_current_admin)):
    """Return all users (admin only)."""
    users = list(db.users.find({}, {"password": 0}))
    return {
        "users": [
            {
                "id": str(u["_id"]),
                "email": u["email"],
                "full_name": u.get("full_name", ""),
                "role": u.get("role", "visitor"),
            }
            for u in users
        ]
    }


@router.patch("/admin/{user_id}/role")
async def update_user_role(
    user_id: str, role_data: dict, current_admin: dict = Depends(get_current_admin)
):
    """Promote or demote a user (admin only)."""
    new_role = role_data.get("role")
    if new_role not in ("admin", "visitor"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'admin' or 'visitor'",
        )

    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")

    target = db.users.find_one({"_id": oid})
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if new_role == "visitor" and target.get("role") == "admin":
        admin_count = db.users.count_documents({"role": "admin"})
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the last admin",
            )

    db.users.update_one({"_id": oid}, {"$set": {"role": new_role}})
    return {"message": f"User role updated to {new_role}"}


@router.delete("/admin/{user_id}")
async def delete_user(user_id: str, current_admin: dict = Depends(get_current_admin)):
    """Delete a user and all their data (admin only)."""
    if user_id == current_admin["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )

    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")

    user = db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.resumes.delete_many({"candidate_id": user_id})
    db.applications.delete_many({"candidate_id": user_id})
    db.match_results.delete_many({"candidate_id": user_id})
    db.users.delete_one({"_id": oid})

    return {"message": "User deleted successfully"}
