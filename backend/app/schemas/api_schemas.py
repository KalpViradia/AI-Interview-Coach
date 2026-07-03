"""
API Pydantic schemas — request/response models for FastAPI endpoints.
"""

from pydantic import BaseModel
from typing import Optional
from app.schemas.agent_schemas import SessionReport, Question, Evaluation

class SessionCreateRequest(BaseModel):
    resume_text: Optional[str] = None
    jd_text: Optional[str] = None
    resume_id: Optional[str] = None
    interview_type: str = "general" # general, resume_based, job_specific, ats_check

class SessionCreateResponse(BaseModel):
    session_id: str
    status: str
    candidate_profile: Optional[dict] = None
    next_question: Optional[Question]

class AnswerSubmitRequest(BaseModel):
    answer: str

class AnswerSubmitResponse(BaseModel):
    status: str
    evaluation: Optional[Evaluation]
    next_question: Optional[Question]
    report: Optional[SessionReport]
    is_complete: bool
