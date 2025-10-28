from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import db

app = FastAPI(title="ResumeMatch AI Backend")

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend is running", "db_status": db.name}

@app.get("/test-mongo")
def test_mongo():
    collection_names = db.list_collection_names()
    return {"collections": collection_names}
