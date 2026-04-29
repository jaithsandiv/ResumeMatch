"""
Seed script to create the default System Administrator user in MongoDB.

Also migrates legacy data so ownership-based access control works correctly:
  - Promotes the existing ``admin@example.com`` user to ``system_administrator``
    if it was previously seeded with the old ``admin`` role.
  - Backfills ``created_by`` on every job document missing it, assigning the
    System Administrator as the default owner.

Run after setting up the database and environment variables.
"""

import os
from dotenv import load_dotenv
from app.database import db
from passlib.context import CryptContext

# Load environment variables
load_dotenv()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SYSTEM_ADMIN_EMAIL = "admin@example.com"
SYSTEM_ADMIN_ROLE = "system_administrator"


def _ensure_system_admin() -> str | None:
    """
    Ensure the default System Administrator account exists with the
    ``system_administrator`` role.  Returns the user's id (string), or None
    if the operation could not be completed.
    """
    existing = db.users.find_one({"email": SYSTEM_ADMIN_EMAIL})

    if existing:
        # Promote legacy admin to system_administrator if needed.
        if existing.get("role") != SYSTEM_ADMIN_ROLE:
            db.users.update_one(
                {"_id": existing["_id"]},
                {"$set": {"role": SYSTEM_ADMIN_ROLE}},
            )
            print(f"✓ Promoted {SYSTEM_ADMIN_EMAIL} to {SYSTEM_ADMIN_ROLE}")
        else:
            print(f"System Administrator already exists: {SYSTEM_ADMIN_EMAIL}")
        return str(existing["_id"])

    admin_password = os.getenv("ADMIN_PASSWORD")
    if not admin_password:
        print("ERROR: ADMIN_PASSWORD environment variable is not set")
        print("Please set ADMIN_PASSWORD in your .env file")
        return None

    hashed_password = pwd_context.hash(admin_password)
    admin_user = {
        "email": SYSTEM_ADMIN_EMAIL,
        "password": hashed_password,
        "full_name": "System Administrator",
        "role": SYSTEM_ADMIN_ROLE,
    }
    result = db.users.insert_one(admin_user)
    print(f"✓ System Administrator created — {SYSTEM_ADMIN_EMAIL} (id={result.inserted_id})")
    return str(result.inserted_id)


def _backfill_job_ownership(default_owner_id: str) -> None:
    """Assign the default owner to every job missing a ``created_by`` field."""
    if not default_owner_id:
        return

    result = db.jobs.update_many(
        {"$or": [{"created_by": {"$exists": False}}, {"created_by": None}, {"created_by": ""}]},
        {"$set": {"created_by": default_owner_id}},
    )
    if result.modified_count:
        print(f"✓ Backfilled created_by on {result.modified_count} job(s) → {default_owner_id}")
    else:
        print("All jobs already have an owner — no backfill needed.")


def seed_admin() -> None:
    owner_id = _ensure_system_admin()
    if owner_id:
        _backfill_job_ownership(owner_id)


if __name__ == "__main__":
    seed_admin()
