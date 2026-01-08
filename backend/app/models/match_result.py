"""
Match Result Model

Defines the MongoDB document structure for storing Graph-RAG 
skill matching results.
"""

from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class MatchExplainability(BaseModel):
    """
    Explainability entry for a single skill match.
    """
    job_skill: str = Field(..., description="Job requirement skill name")
    candidate_skill: str = Field(..., description="Candidate possessed skill name")
    similarity: float = Field(..., ge=0.0, le=1.0, description="Similarity score between skills")


class MatchResultCreate(BaseModel):
    """
    Schema for creating a new match result.
    """
    job_id: str = Field(..., description="Job posting identifier")
    candidate_id: str = Field(..., description="Candidate/resume identifier")
    match_score: float = Field(..., ge=0.0, le=100.0, description="Overall match score (0-100)")
    matched_skills: List[str] = Field(default_factory=list, description="List of matched job skills")
    missing_skills: List[str] = Field(default_factory=list, description="List of unmatched job skills")
    explainability: List[MatchExplainability] = Field(default_factory=list, description="Detailed skill-by-skill explanation")


class MatchResultDocument(MatchResultCreate):
    """
    Complete match result document as stored in MongoDB.
    """
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of match computation")
    
    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "507f1f77bcf86cd799439011",
                "candidate_id": "507f191e810c19729de860ea",
                "match_score": 78.5,
                "matched_skills": ["Python", "FastAPI", "MongoDB"],
                "missing_skills": ["Docker", "Kubernetes"],
                "explainability": [
                    {
                        "job_skill": "Python",
                        "candidate_skill": "Python",
                        "similarity": 1.0
                    },
                    {
                        "job_skill": "FastAPI",
                        "candidate_skill": "FastAPI",
                        "similarity": 1.0
                    }
                ],
                "created_at": "2026-01-08T12:00:00Z"
            }
        }


class MatchResultResponse(BaseModel):
    """
    API response for match result.
    """
    job_id: str
    candidate_id: str
    match_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    explainability: List[Dict]
    message: str
