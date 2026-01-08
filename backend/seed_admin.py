"""
Seed script to create a default admin user in MongoDB.
Run this script after setting up the database and environment variables.
"""

import os
from dotenv import load_dotenv
from app.database import db
from passlib.context import CryptContext

# Load environment variables
load_dotenv()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_admin():
    """
    Create a default admin user if it doesn't exist.
    Password is read from ADMIN_PASSWORD environment variable.
    """
    # Get admin password from environment
    admin_password = os.getenv("ADMIN_PASSWORD")
    
    if not admin_password:
        print("ERROR: ADMIN_PASSWORD environment variable is not set")
        print("Please set ADMIN_PASSWORD in your .env file")
        return
    
    # Check if admin already exists
    existing_admin = db.users.find_one({"email": "admin@example.com"})
    
    if existing_admin:
        print("Admin user already exists with email: admin@example.com")
        return
    
    # Hash the password
    hashed_password = pwd_context.hash(admin_password)
    
    # Create admin user document
    admin_user = {
        "email": "admin@example.com",
        "password": hashed_password,
        "full_name": "System Administrator",
        "role": "admin"
    }
    
    # Insert into database
    result = db.users.insert_one(admin_user)
    
    print(f"✓ Admin user created successfully")
    print(f"  Email: admin@example.com")
    print(f"  Role: admin")
    print(f"  User ID: {result.inserted_id}")


if __name__ == "__main__":
    seed_admin()
