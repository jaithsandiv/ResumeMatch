from fastapi import APIRouter, HTTPException, status, Depends
from passlib.context import CryptContext
from app.database import db
from app.utils.jwt_utils import create_access_token
from app.utils.auth_dependencies import get_current_user, get_current_admin

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register")
async def register(user_data: dict):
    """
    Register a new user.
    
    Expected payload:
    {
        "name": "John Doe",
        "email": "user@example.com",
        "password": "password123"
    }
    
    Returns JWT token and user info. Default role is "visitor".
    """
    # Validate required fields
    email = user_data.get("email")
    password = user_data.get("password")
    name = user_data.get("name")
    
    if not email or not password or not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name, email, and password are required"
        )
    
    # Check if user already exists
    existing_user = db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Hash password
    hashed_password = pwd_context.hash(password)
    
    # Create user document with role "visitor" by default
    user_doc = {
        "email": email,
        "password": hashed_password,
        "full_name": name,
        "role": "visitor"
    }
    
    result = db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create JWT token
    token_data = {
        "id": user_id,
        "email": email,
        "full_name": name,
        "role": "visitor"
    }
    access_token = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": email,
            "full_name": name,
            "role": "visitor"
        }
    }


@router.post("/login")
async def login(credentials: dict):
    """
    Authenticate user and return JWT token.
    
    Expected payload:
    {
        "email": "user@example.com",
        "password": "password123"
    }
    """
    email = credentials.get("email")
    password = credentials.get("password")
    
    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required"
        )
    
    # Find user by email
    user = db.users.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not pwd_context.verify(password, user.get("password")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create JWT token with consistent payload
    token_data = {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user.get("full_name", ""),
        "role": user.get("role", "visitor")
    }
    access_token = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "role": user.get("role", "visitor")
        }
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user information.
    
    Requires: Valid JWT token
    Returns: Current user details
    """
    return {
        "user": current_user
    }


@router.get("/admin/me")
async def get_admin_me(current_admin: dict = Depends(get_current_admin)):
    """
    Get current admin user information.

    Requires: Valid JWT token with admin role
    Returns: Current admin details
    """
    return {
        "admin": current_admin,
        "message": "You have admin access"
    }


@router.get("/admin/stats")
async def get_admin_stats(current_admin: dict = Depends(get_current_admin)):
    """
    Get platform-wide statistics for the admin dashboard.

    Requires: Valid JWT token with admin role
    Returns: Counts of resumes, applications, and users
    """
    return {
        "total_resumes": db.resumes.count_documents({}),
        "total_applications": db.applications.count_documents({}),
        "total_users": db.users.count_documents({}),
    }
