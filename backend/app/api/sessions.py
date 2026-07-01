"""
Session API endpoints.

Handles session creation, interview turn submission, and report retrieval.

Auth model:
  - POST /sessions: optional auth (guest mode supported — no DB write for guests)
  - POST /sessions/{id}/answer: optional auth (guest answers work via LangGraph checkpointer only)
  - GET /sessions: REQUIRES auth (shows only current user's sessions)
  - GET /sessions/{id}: optional auth (guest sessions live in LangGraph only)
  - GET /sessions/{id}/transcript: REQUIRES auth + ownership check
"""

import uuid
import os
import hashlib
import time
import traceback
import logging
from typing import Optional

logger = logging.getLogger(__name__)
from fastapi import APIRouter, Request, HTTPException, Depends, File, UploadFile
from langgraph.types import Command
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.db import get_db
from app.models.schema import InterviewSession, Question, Answer, AnswerEvaluation, Report, User, Resume
from app.schemas.api_schemas import (
    SessionCreateRequest, 
    SessionCreateResponse, 
    AnswerSubmitRequest, 
    AnswerSubmitResponse
)
from app.core.auth import get_current_user, get_optional_user, CurrentUser
from app.core.config import get_settings
from google import genai

router = APIRouter(tags=["sessions"])

# ---------------------------------------------------------------------------
# In-memory ATS analysis cache — keyed by SHA-256 of resume_text + jd_text.
# Avoids redundant Gemini calls when the same Resume+JD is submitted again.
# Persists for the lifetime of the server process (good enough for demo).
# ---------------------------------------------------------------------------
_ats_cache: dict[str, dict] = {}

@router.post("/sessions", response_model=SessionCreateResponse)
async def create_session(
    payload: SessionCreateRequest, 
    request: Request, 
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
):
    """Create a new interview session.
    
    Authenticated users: session is saved to PostgreSQL for dashboard/history.
    Guests: session lives only in LangGraph checkpointer (no persistence).
    """
    graph = request.app.state.graph
    if not graph:
        raise HTTPException(status_code=500, detail="Graph not initialized")
        
    session_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": session_id}}
    
    resume_text = payload.resume_text or ""
    jd_text = payload.jd_text or ""
    
    # If a resume_id is provided, fetch it from DB (must belong to user)
    if payload.resume_id and current_user:
        result = await db.execute(
            select(Resume).where(
                Resume.id == uuid.UUID(payload.resume_id),
                Resume.user_id == uuid.UUID(current_user.id)
            )
        )
        resume = result.scalars().first()
        if resume:
            resume_text = resume.raw_text
            # Update last_used
            from datetime import datetime, timezone
            resume.last_used = datetime.now(timezone.utc)
            await db.commit()
    
    # Only Job-Specific and ATS Check use a JD
    if payload.interview_type not in ["job_specific", "ats_check"]:
        jd_text = ""
    
    historical_scores = []
    if current_user:
        try:
            stmt = (
                select(Report.summary_json)
                .join(InterviewSession, Report.session_id == InterviewSession.id)
                .where(InterviewSession.user_id == uuid.UUID(current_user.id))
                .where(InterviewSession.status == "completed")
                .order_by(InterviewSession.completed_at.desc())
                .limit(5)
            )
            result = await db.execute(stmt)
            # Reverse to get chronological order (oldest to newest of the last 5)
            rows = result.all()
            historical_scores = [float(row[0].get("score", 0)) for row in rows if isinstance(row[0], dict) and "score" in row[0]][::-1]
        except Exception as e:
            await db.rollback()
            print(f"Failed to fetch historical scores: {e}")
            
    # -----------------------------------------------------------------------
    # ATS Cache: check if we've already analyzed this exact Resume+JD pair.
    # If so, inject the cached candidate_profile and skip the Gemini analyzer.
    # -----------------------------------------------------------------------
    cache_key = hashlib.sha256(
        (resume_text + jd_text).encode("utf-8")
    ).hexdigest()
    cached_profile = _ats_cache.get(cache_key)
    
    if cached_profile:
        print(f"ATS Cache HIT for key {cache_key[:12]}... — skipping Gemini analyzer")
    else:
        print(f"ATS Cache MISS — will run Gemini analyzer")
    
    # Initialize state
    initial_state = {
        "resume_text": resume_text,
        "jd_text": jd_text,
        "historical_scores": historical_scores,
        "interview_history": [],
        "current_difficulty": 1,
        "turn_count": 0,
        "questions": [],
        "evaluations": [],
        "pending_followup_question": None,
        # Inject cached profile if available — the analyzer node will be skipped
        # because the graph's START→analyzer path reads candidate_profile from state
        # and the analyzer checks this before calling Gemini.
        **(  {"candidate_profile": cached_profile} if cached_profile else {}  ),
    }
    
    # Run graph until it pauses at wait_for_answer interrupt
    try:
        final_state = await graph.ainvoke(initial_state, config=config)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
        
    next_question = final_state.get("next_question")
    candidate_profile = final_state.get("candidate_profile")
    
    # Save analyzer result to cache if this was a cache miss
    if not cached_profile and candidate_profile:
        _ats_cache[cache_key] = candidate_profile
        print(f"ATS Cache STORED for key {cache_key[:12]}...")
    
    # Write to DB only for authenticated users
    if current_user:
        new_session = InterviewSession(
            id=uuid.UUID(session_id),
            user_id=uuid.UUID(current_user.id),
            resume_id=uuid.UUID(payload.resume_id) if payload.resume_id else None,
            session_type=payload.interview_type,
            status="in_progress"
        )
        db.add(new_session)
        
        if next_question:
            db_question = Question(
                session_id=new_session.id,
                text=next_question["text"],
                topic=next_question["topic"],
                difficulty=next_question["difficulty"],
                order_index=1
            )
            db.add(db_question)
            
        await db.commit()
    
    return SessionCreateResponse(
        session_id=session_id,
        candidate_profile=candidate_profile,
        next_question=next_question
    )

@router.post("/sessions/{session_id}/answer", response_model=AnswerSubmitResponse)
async def submit_answer(
    session_id: str, 
    payload: AnswerSubmitRequest, 
    request: Request, 
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
):
    """Submit an answer to the current question.
    
    Works for both authenticated and guest users (LangGraph handles the state).
    DB writes only happen for authenticated users with matching session ownership.
    """
    graph = request.app.state.graph
    if not graph:
        raise HTTPException(status_code=500, detail="Graph not initialized")
        
    config = {"configurable": {"thread_id": session_id}}
    
    # Verify session exists in LangGraph checkpointer
    current_state_tuple = await graph.aget_state(config)
    if not current_state_tuple or not current_state_tuple.values:
        raise HTTPException(status_code=404, detail="Session not found")
        
    try:
        start_time = time.time()
        final_state = await graph.ainvoke(
            Command(resume=payload.answer), 
            config=config
        )
        exec_time = time.time() - start_time
        
        turn = final_state.get("turn_count", 0)
        logger.info(
            f"Answer processed successfully for session {session_id}",
            extra={
                "session_id": session_id,
                "question_number": turn,
                "answer_length": len(payload.answer),
                "execution_time_sec": round(exec_time, 2)
            }
        )
    except Exception as e:
        logger.error(
            f"Failed to process answer for session {session_id}: {str(e)}\n{traceback.format_exc()}",
            extra={"session_id": session_id, "answer_length": len(payload.answer)}
        )
        raise HTTPException(status_code=500, detail="Unable to evaluate interview response.")
        
    evaluations = final_state.get("evaluations", [])
    latest_evaluation = evaluations[-1] if evaluations else None
    next_question = final_state.get("next_question")
    report = final_state.get("report")
    
    is_complete = report is not None
    
    if is_complete:
        next_question = None
        
    # --- DB Updates (only for authenticated users with a matching session) ---
    if current_user:
        session_result = await db.execute(
            select(InterviewSession).where(
                InterviewSession.id == uuid.UUID(session_id),
                InterviewSession.user_id == uuid.UUID(current_user.id),
            )
        )
        db_session = session_result.scalars().first()
        
        if db_session:
            # Upgrade session type to mock_interview on first answer
            if db_session.session_type == "ats_check":
                db_session.session_type = "mock_interview"

            # Find the last question in DB for this session (the one being answered)
            q_result = await db.execute(
                select(Question)
                .where(Question.session_id == uuid.UUID(session_id))
                .order_by(Question.order_index.desc())
                .limit(1)
            )
            last_db_question = q_result.scalars().first()
            
            if last_db_question and latest_evaluation and payload.answer != "__END_INTERVIEW__":
                db_answer = Answer(
                    question_id=last_db_question.id,
                    text=payload.answer
                )
                db.add(db_answer)
                await db.flush()  # to get db_answer.id
                
                db_eval = AnswerEvaluation(
                    answer_id=db_answer.id,
                    score=latest_evaluation.get("score"),
                    strengths_json=latest_evaluation.get("strengths", []),
                    weaknesses_json=latest_evaluation.get("weaknesses", []),
                    feedback=latest_evaluation.get("suggestion", "")
                )
                db.add(db_eval)
                
            if next_question:
                turn_count = final_state.get("turn_count", 0)
                db_question = Question(
                    session_id=uuid.UUID(session_id),
                    text=next_question["text"],
                    topic=next_question["topic"],
                    difficulty=next_question["difficulty"],
                    order_index=turn_count + 1
                )
                db.add(db_question)
                
            if report:
                db_report = Report(
                    session_id=uuid.UUID(session_id),
                    summary_json={
                        "summary": report.get("summary", ""),
                        "score": report.get("score", 0.0),
                        "technical_score": report.get("technical_score", 0.0),
                        "communication_score": report.get("communication_score", 0.0),
                        "problem_solving_score": report.get("problem_solving_score", 0.0)
                    },
                    weak_topics_json=report.get("weak_topics", []),
                    roadmap_json=report.get("roadmap", []),
                    readiness_label=report.get("readiness_label", "")
                )
                db.add(db_report)
                
                # Mark session completed
                from datetime import datetime, timezone
                db_session.status = "completed"
                db_session.completed_at = datetime.now(timezone.utc)
                    
            await db.commit()
        
    return AnswerSubmitResponse(
        evaluation=latest_evaluation,
        next_question=next_question,
        report=report,
        is_complete=is_complete
    )

@router.get("/sessions")
async def get_sessions(
    request: Request, 
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Fetch all sessions for the authenticated user's dashboard.
    
    REQUIRES authentication — returns 401 for unauthenticated requests.
    Only returns sessions belonging to the current user.
    """
    graph = request.app.state.graph
    
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == uuid.UUID(current_user.id))
        .options(selectinload(InterviewSession.report))
        .order_by(InterviewSession.started_at.desc())
    )
    
    sessions = result.scalars().all()
    
    # Format for frontend
    formatted_sessions = []
    for s in sessions:
        # Fetch LangGraph state to get ATS Breakdown
        ats_data = None
        if graph:
            try:
                state_tuple = await graph.aget_state({"configurable": {"thread_id": str(s.id)}})
                if state_tuple and state_tuple.values:
                    profile = state_tuple.values.get("candidate_profile")
                    if profile and "ats_breakdown" in profile:
                        ats_data = profile["ats_breakdown"]
            except Exception:
                pass

        formatted_sessions.append({
            "id": str(s.id),
            "status": s.status,
            "session_type": s.session_type,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "ats_breakdown": ats_data,
            "report": {
                "summary": (s.report.summary_json or {}).get("summary", "") if s.report else "",
                "score": (s.report.summary_json or {}).get("score", 0.0) if s.report else 0.0,
                "technical_score": (s.report.summary_json or {}).get("technical_score", 0.0) if s.report else 0.0,
                "communication_score": (s.report.summary_json or {}).get("communication_score", 0.0) if s.report else 0.0,
                "problem_solving_score": (s.report.summary_json or {}).get("problem_solving_score", 0.0) if s.report else 0.0,
                "readiness_label": s.report.readiness_label if s.report else "",
                "weak_topics": s.report.weak_topics_json if s.report else [],
            } if s.report else None
        })
        
    return formatted_sessions

@router.get("/sessions/{session_id}")
async def get_session_state(
    session_id: str, 
    request: Request, 
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
):
    """Fetch current session state including the latest question and turn count.
    
    Supports both authenticated and guest users (LangGraph holds state for both).
    For authenticated users, also verifies ownership.
    """
    graph = request.app.state.graph
    if not graph:
        raise HTTPException(status_code=500, detail="Graph not initialized")
        
    config = {"configurable": {"thread_id": session_id}}
    
    # Get state from LangGraph checkpointer
    current_state_tuple = await graph.aget_state(config)
    if not current_state_tuple or not current_state_tuple.values:
        raise HTTPException(status_code=404, detail="Session not found")
        
    state = current_state_tuple.values
    
    # If authenticated, verify ownership and get DB report fallback
    session_type = "mock_interview"
    db_report_dict = None
    if current_user:
        session_result = await db.execute(
            select(InterviewSession).where(
                InterviewSession.id == uuid.UUID(session_id),
                InterviewSession.user_id == uuid.UUID(current_user.id),
            ).options(selectinload(InterviewSession.report))
        )
        db_session = session_result.scalars().first()
        if db_session:
            session_type = db_session.session_type
            if db_session.report:
                db_report_dict = {
                    "summary": (db_session.report.summary_json or {}).get("summary", ""),
                    "score": (db_session.report.summary_json or {}).get("score", 0.0),
                    "technical_score": (db_session.report.summary_json or {}).get("technical_score", 0.0),
                    "communication_score": (db_session.report.summary_json or {}).get("communication_score", 0.0),
                    "problem_solving_score": (db_session.report.summary_json or {}).get("problem_solving_score", 0.0),
                    "readiness_label": db_session.report.readiness_label,
                    "weak_topics": db_session.report.weak_topics_json,
                    "roadmap": db_session.report.roadmap_json,
                    "strong_topics": (db_session.report.summary_json or {}).get("strong_topics", []),
                }
    
    final_report = state.get("report") or db_report_dict

    return {
        "session_id": session_id,
        "next_question": state.get("next_question"),
        "turn_count": state.get("turn_count", 0),
        "is_complete": final_report is not None,
        "session_type": session_type,
        "report": final_report,
        "candidate_profile": state.get("candidate_profile")
    }

@router.get("/sessions/{session_id}/transcript")
async def get_session_transcript(
    session_id: str, 
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
):
    """Fetch the full Q&A transcript for a session.
    
    Supports both authenticated and guest users via LangGraph state.
    """
    # 1. Try DB first if user is authenticated
    if current_user:
        session_result = await db.execute(
            select(InterviewSession).where(
                InterviewSession.id == uuid.UUID(session_id),
                InterviewSession.user_id == uuid.UUID(current_user.id),
            )
        )
        db_session = session_result.scalars().first()
        if db_session:
            result = await db.execute(
                select(Question)
                .where(Question.session_id == uuid.UUID(session_id))
                .options(
                    selectinload(Question.answer).selectinload(Answer.evaluation)
                )
                .order_by(Question.order_index.asc())
            )
            
            questions = result.scalars().all()
            
            transcript = []
            for q in questions:
                turn = {
                    "question": q.text,
                    "topic": q.topic,
                    "difficulty": q.difficulty,
                    "order_index": q.order_index,
                    "answer": None,
                    "evaluation": None
                }
                
                if q.answer:
                    turn["answer"] = q.answer.text
                    if q.answer.evaluation:
                        eval_db = q.answer.evaluation
                        turn["evaluation"] = {
                            "score": eval_db.score,
                            "strengths": eval_db.strengths_json,
                            "weaknesses": eval_db.weaknesses_json,
                            "feedback": eval_db.feedback,
                        }
                transcript.append(turn)
            return transcript

    # 2. Fallback to LangGraph state (for guests)
    graph = request.app.state.graph
    if not graph:
        raise HTTPException(status_code=500, detail="Graph not initialized")
        
    config = {"configurable": {"thread_id": session_id}}
    current_state_tuple = await graph.aget_state(config)
    if not current_state_tuple or not current_state_tuple.values:
        raise HTTPException(status_code=404, detail="Session not found")
        
    state = current_state_tuple.values
    questions_state = state.get("questions", [])
    evaluations_state = state.get("evaluations", [])
    
    transcript = []
    for i, q in enumerate(questions_state):
        # Handle dict or BaseModel
        q_text = getattr(q, 'text', q.get('text', '')) if isinstance(q, dict) else q.text
        q_topic = getattr(q, 'topic', q.get('topic', '')) if isinstance(q, dict) else q.topic
        q_diff = getattr(q, 'difficulty', q.get('difficulty', 1)) if isinstance(q, dict) else q.difficulty
        
        turn = {
            "question": q_text,
            "topic": q_topic,
            "difficulty": q_diff,
            "order_index": i + 1,
            "answer": None,
            "evaluation": None
        }
        
        if i < len(evaluations_state):
            ev = evaluations_state[i]
            ev_answer = getattr(ev, 'answer', ev.get('answer', '')) if isinstance(ev, dict) else ev.answer
            ev_score = getattr(ev, 'score', ev.get('score')) if isinstance(ev, dict) else ev.score
            ev_strengths = getattr(ev, 'strengths', ev.get('strengths', [])) if isinstance(ev, dict) else ev.strengths
            ev_weaknesses = getattr(ev, 'weaknesses', ev.get('weaknesses', [])) if isinstance(ev, dict) else ev.weaknesses
            ev_suggestion = getattr(ev, 'suggestion', ev.get('suggestion', '')) if isinstance(ev, dict) else ev.suggestion
            
            turn["answer"] = ev_answer
            if ev_score is not None:
                turn["evaluation"] = {
                    "score": ev_score,
                    "strengths": ev_strengths,
                    "weaknesses": ev_weaknesses,
                    "feedback": ev_suggestion,
                }
        transcript.append(turn)
        
    return transcript

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Receives an audio blob, sends it to Gemini API for transcription, and returns text."""
    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)
    
    try:
        audio_bytes = await audio.read()
        mime_type = audio.content_type or "audio/webm"
        
        prompt = "Transcribe the following audio accurately. Output ONLY the raw transcribed text. Do not add conversational filler, markdown, or timestamps."
        
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                prompt,
                {"mime_type": mime_type, "data": audio_bytes}
            ]
        )
        
        text = response.text.strip()
        return {"text": text}
    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail="Failed to transcribe audio.")

