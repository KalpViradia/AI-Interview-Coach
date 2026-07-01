"""
Resume API endpoints.

Handles Resume Vault CRUD operations for authenticated users.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.db import get_db
from app.models.schema import Resume, InterviewSession
from app.core.auth import get_current_user, CurrentUser
from app.tools.pdf_parser import extract_text_from_pdf
from app.core.upload_utils import validate_uploaded_file, validate_extracted_text

from app.schemas.resume_studio_schemas import ResumeAnalysis, ATSCheckRequest
from app.schemas.agent_schemas import ATSBreakdown
from app.services.resume_analyzer import analyze_resume_content
from app.services.ats_scoring import calculate_final_ats_breakdown

router = APIRouter(tags=["resumes"])

class ResumeResponse(BaseModel):
    id: str
    display_name: str
    original_filename: str
    created_at: str
    last_used: str
    file_size: int
    interview_count: int

class ResumeDetailResponse(ResumeResponse):
    extracted_text: str
    ats_checks: int
    mock_interviews: int
    voice_interviews: int
    resume_chats: int
    average_score: Optional[float]

class RenameResumeRequest(BaseModel):
    display_name: str


@router.get("/resumes", response_model=List[ResumeResponse])
async def get_resumes(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get all resumes in the vault for the authenticated user."""
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == uuid.UUID(current_user.id))
        .options(selectinload(Resume.sessions))
        .order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()
    
    formatted = []
    for r in resumes:
        formatted.append(ResumeResponse(
            id=str(r.id),
            display_name=r.display_name or "My Resume",
            original_filename=r.original_filename or "",
            created_at=r.created_at.isoformat() if r.created_at else "",
            last_used=r.last_used.isoformat() if r.last_used else "",
            file_size=r.file_size or 0,
            interview_count=len(r.sessions)
        ))
        
    return formatted

@router.post("/resumes", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    display_name: str = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Upload a new resume to the vault."""
    filename = file.filename.lower() if file.filename else ""
    
    try:
        content = await file.read()
        file_type = validate_uploaded_file(filename, content, max_size_mb=5)
        
        if file_type == 'pdf':
            text = extract_text_from_pdf(content)
        else:
            text = content.decode('utf-8', errors='ignore')
            
        validate_extracted_text(text)
            
        new_resume = Resume(
            user_id=uuid.UUID(current_user.id),
            display_name=display_name or file.filename or "My Resume",
            original_filename=file.filename or "",
            raw_text=text,
            file_size=len(content),
            created_at=datetime.now(timezone.utc),
            last_used=datetime.now(timezone.utc)
        )
        db.add(new_resume)
        await db.commit()
        await db.refresh(new_resume)
        
        return ResumeResponse(
            id=str(new_resume.id),
            display_name=new_resume.display_name,
            original_filename=new_resume.original_filename,
            created_at=new_resume.created_at.isoformat(),
            last_used=new_resume.last_used.isoformat(),
            file_size=new_resume.file_size,
            interview_count=0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


@router.get("/resumes/{resume_id}", response_model=ResumeDetailResponse)
async def get_resume_details(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get details and statistics for a specific resume."""
    result = await db.execute(
        select(Resume)
        .where(
            Resume.id == uuid.UUID(resume_id),
            Resume.user_id == uuid.UUID(current_user.id)
        )
        .options(selectinload(Resume.sessions).selectinload(InterviewSession.report))
    )
    resume = result.scalars().first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    ats_checks = sum(1 for s in resume.sessions if s.session_type == "ats_check")
    mock_interviews = sum(1 for s in resume.sessions if s.session_type in ["mock_interview", "general", "resume_based", "job_specific"])
    
    # We don't have separate types for voice and text interviews in DB right now,
    # but we will return 0 for now or calculate based on some heuristic if needed.
    # We will just map mock_interviews to the total for now.
    
    scores = [s.report.summary_json.get("score", 0) for s in resume.sessions if s.report and s.report.summary_json.get("score")]
    avg_score = sum(scores) / len(scores) if scores else None

    return ResumeDetailResponse(
        id=str(resume.id),
        display_name=resume.display_name or "My Resume",
        original_filename=resume.original_filename or "",
        created_at=resume.created_at.isoformat() if resume.created_at else "",
        last_used=resume.last_used.isoformat() if resume.last_used else "",
        file_size=resume.file_size or 0,
        interview_count=len(resume.sessions),
        extracted_text=resume.raw_text,
        parsed_json=resume.parsed_json,
        ats_checks=ats_checks,
        mock_interviews=mock_interviews,
        voice_interviews=0, # Placeholder
        resume_chats=0,     # Placeholder
        average_score=avg_score
    )

@router.get("/resumes/{resume_id}/download")
async def download_resume(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Download the extracted text of the resume as a file."""
    result = await db.execute(
        select(Resume).where(
            Resume.id == uuid.UUID(resume_id),
            Resume.user_id == uuid.UUID(current_user.id)
        )
    )
    resume = result.scalars().first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    return Response(
        content=resume.raw_text,
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename={resume.original_filename or 'resume'}.txt"
        }
    )

@router.patch("/resumes/{resume_id}", response_model=ResumeResponse)
async def rename_resume(
    resume_id: str,
    payload: RenameResumeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Rename a resume."""
    result = await db.execute(
        select(Resume).where(
            Resume.id == uuid.UUID(resume_id),
            Resume.user_id == uuid.UUID(current_user.id)
        ).options(selectinload(Resume.sessions))
    )
    resume = result.scalars().first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    resume.display_name = payload.display_name
    await db.commit()
    await db.refresh(resume)
    
    return ResumeResponse(
        id=str(resume.id),
        display_name=resume.display_name,
        original_filename=resume.original_filename or "",
        created_at=resume.created_at.isoformat() if resume.created_at else "",
        last_used=resume.last_used.isoformat() if resume.last_used else "",
        file_size=resume.file_size or 0,
        interview_count=len(resume.sessions)
    )

@router.delete("/resumes/{resume_id}")
async def delete_resume(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete a resume."""
    result = await db.execute(
        select(Resume).where(
            Resume.id == uuid.UUID(resume_id),
            Resume.user_id == uuid.UUID(current_user.id)
        )
    )
    resume = result.scalars().first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    await db.delete(resume)
    await db.commit()
    
    return {"status": "success", "message": "Resume deleted"}


@router.get("/resumes/{resume_id}/analyze", response_model=ResumeAnalysis)
async def analyze_resume(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Perform a standalone AI analysis of the resume.
    Extracts skills, structured data, and provides narrative feedback.
    """
    result = await db.execute(
        select(Resume).where(
            Resume.id == uuid.UUID(resume_id),
            Resume.user_id == uuid.UUID(current_user.id)
        )
    )
    resume = result.scalars().first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    analysis = await analyze_resume_content(resume.raw_text)
    
    if analysis.parsed_resume and not resume.parsed_json:
        resume.parsed_json = analysis.parsed_resume.model_dump()
        await db.commit()

    return analysis


@router.post("/resumes/{resume_id}/ats-check", response_model=ATSBreakdown)
async def run_ats_check(
    resume_id: str,
    payload: ATSCheckRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Run full ATS scoring against a user-provided JD text.
    """
    result = await db.execute(
        select(Resume).where(
            Resume.id == uuid.UUID(resume_id),
            Resume.user_id == uuid.UUID(current_user.id)
        )
    )
    resume = result.scalars().first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    breakdown = await calculate_final_ats_breakdown(resume.raw_text, payload.jd_text)
    return breakdown
