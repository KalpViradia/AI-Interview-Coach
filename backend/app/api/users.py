from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.db import get_db
from app.models.schema import User, Resume, InterviewSession, Report
from app.core.auth import get_current_user, CurrentUser
from app.core.cloudinary_utils import upload_file_to_cloudinary, delete_file_from_cloudinary
import uuid

router = APIRouter(tags=["users"])

class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str
    avatar_url: Optional[str] = None
    
    # Stats
    resume_count: int
    interviews_taken: int
    ats_checks_run: int
    average_score: Optional[float] = None

@router.get("/users/me", response_model=UserProfileResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(current_user.id))
        .options(
            selectinload(User.resumes),
            selectinload(User.sessions).selectinload(InterviewSession.report)
        )
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    resume_count = len(user.resumes)
    interviews_taken = sum(1 for s in user.sessions if s.session_type != "ats_check")
    ats_checks_run = sum(1 for s in user.sessions if s.session_type == "ats_check")
    
    scores = [s.report.summary_json.get("score", 0) for s in user.sessions if s.report and s.report.summary_json.get("score")]
    average_score = sum(scores) / len(scores) if scores else None
    
    return UserProfileResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        created_at=user.created_at.isoformat() if user.created_at else "",
        avatar_url=user.avatar_url,
        resume_count=resume_count,
        interviews_taken=interviews_taken,
        ats_checks_run=ats_checks_run,
        average_score=average_score
    )


