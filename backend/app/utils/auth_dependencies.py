"""
Authentication dependencies for FastAPI route protection.
Implements JWT-based authentication and role-based access control.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from bson import ObjectId
from app.utils.jwt_utils import verify_token
from app.database import db

# HTTP Bearer token scheme for Swagger UI
security = HTTPBearer()

# Role constants
ROLE_VISITOR = "visitor"
ROLE_ADMIN = "admin"
ROLE_SYSTEM_ADMIN = "system_administrator"

# Roles considered "admin tier" — both regular and system admins pass admin guards.
ADMIN_ROLES = {ROLE_ADMIN, ROLE_SYSTEM_ADMIN}


def is_admin(user: dict) -> bool:
    """Return True if the user has any admin-tier role."""
    return user.get("role") in ADMIN_ROLES


def is_system_admin(user: dict) -> bool:
    """Return True if the user is a system administrator (bypass owner)."""
    return user.get("role") == ROLE_SYSTEM_ADMIN


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verify JWT token and return current user.

    Args:
        credentials: HTTP Authorization header with Bearer token

    Returns:
        User dictionary with id, email, full_name, and role

    Raises:
        HTTPException 401: If token is missing, invalid, or user not found
    """
    # Extract token
    token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Verify and decode token
    try:
        payload = verify_token(token)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Extract user ID from payload
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Fetch user from database
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Return user object (exclude password) — read role from DB so demotions
    # take effect immediately, not only after the next login.
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user.get("full_name", ""),
        "role": user.get("role", ROLE_VISITOR),
    }


async def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Verify current user has any admin-tier role.

    System administrators are also accepted — they share the admin guard
    surface, but bypass per-resource ownership checks downstream.

    Raises:
        HTTPException 403: If user is not an admin or system administrator.
    """
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required. You do not have permission to access this resource."
        )

    return current_user


async def get_current_system_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Verify the current user is a system administrator."""
    if not is_system_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System administrator access required.",
        )
    return current_user


def assert_can_manage_job(user: dict, job: dict) -> None:
    """
    Raise 403 unless the user is a system admin or the job's owner.

    Used by every job-mutation/applicant endpoint to enforce ownership.
    """
    if is_system_admin(user):
        return
    if str(job.get("created_by")) != str(user.get("id")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this job listing.",
        )
