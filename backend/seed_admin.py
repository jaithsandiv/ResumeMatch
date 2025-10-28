# backend/seed_admin.py
from app.database import db
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password):
    return pwd_context.hash(password)

def main():
    users = db["users"]
    if users.find_one({"email": "admin@example.com"}):
        print("Admin already exists")
        return
    users.insert_one({
        "name": "Admin",
        "email": "admin@example.com",
        "password": hash_password("AdminPass1!"),
        "role": "admin"
    })
    print("Admin created")

if __name__ == "__main__":
    main()
