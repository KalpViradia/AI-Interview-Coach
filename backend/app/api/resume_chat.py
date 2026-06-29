from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.auth import get_optional_user, get_current_user, CurrentUser
from app.tools.pdf_parser import extract_text_from_pdf
from app.core.upload_utils import validate_uploaded_file, validate_extracted_text
from app.rag.resume_chat import rag_service
from app.models.db import get_db
from app.models.schema import Resume
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid
import hashlib
import time
from collections import OrderedDict

router = APIRouter(tags=["resume-chat"], prefix="/resume-chat")

# --- Simple In-Memory LRU Cache ---
class LRUCache:
    def __init__(self, capacity: int):
        self.cache = OrderedDict()
        self.capacity = capacity

    def get(self, key: str) -> Optional[str]:
        if key not in self.cache:
            return None
        self.cache.move_to_end(key)
        # Check TTL (1 hour)
        val, timestamp = self.cache[key]
        if time.time() - timestamp > 3600:
            del self.cache[key]
            return None
        return val

    def put(self, key: str, value: str):
        self.cache[key] = (value, time.time())
        self.cache.move_to_end(key)
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

# Global cache instance (Max 1000 items)
query_cache = LRUCache(1000)
# ----------------------------------

class AskQueryRequest(BaseModel):
    session_id: str
    query: str

class AskQueryResponse(BaseModel):
    answer: str
    cached: bool

@router.post("/upload")
async def upload_resume_for_chat(file: UploadFile = File(...)):
    """Extracts text from PDF and ingests it into ChromaDB for RAG."""
    filename = file.filename.lower() if file.filename else ""
    try:
        content = await file.read()
        file_type = validate_uploaded_file(filename, content, max_size_mb=5)
        
        if file_type == 'pdf':
            text = extract_text_from_pdf(content)
        else:
            text = content.decode('utf-8', errors='ignore')
            
        validate_extracted_text(text)
        
        # Generate a unique session ID for this chat
        session_id = str(uuid.uuid4())
        
        # Ingest into Chroma
        await rag_service.ingest_resume(session_id, text)
        
        return {"session_id": session_id, "message": "Resume successfully processed and ready for chat."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/select")
async def select_resume_for_chat(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Start chat using a saved resume from the vault."""
    resume_id = payload.get("resume_id")
    if not resume_id:
        raise HTTPException(status_code=400, detail="resume_id is required")
        
    result = await db.execute(
        select(Resume).where(
            Resume.id == uuid.UUID(resume_id),
            Resume.user_id == uuid.UUID(current_user.id)
        )
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    session_id = str(uuid.uuid4())
    await rag_service.ingest_resume(session_id, resume.raw_text)
    
    return {"session_id": session_id, "message": "Resume successfully processed and ready for chat."}

@router.post("/ask", response_model=AskQueryResponse)
async def ask_resume_query(request: AskQueryRequest):
    """Answers a user query based on their uploaded resume using RAG and Caching."""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    # Generate Cache Key (session_id + hash of history + query)
    history_str = rag_service.get_session_memory(request.session_id).get_history_str()
    combined_context = f"{history_str}|{request.query.strip().lower()}"
    query_hash = hashlib.md5(combined_context.encode()).hexdigest()
    cache_key = f"{request.session_id}_{query_hash}"
    
    # Check Cache
    cached_answer = query_cache.get(cache_key)
    if cached_answer:
        return AskQueryResponse(answer=cached_answer, cached=True)
        
    # Not in cache, query RAG Service
    try:
        answer = await rag_service.answer_query(request.session_id, request.query)
        # Store in Cache
        query_cache.put(cache_key, answer)
        return AskQueryResponse(answer=answer, cached=False)
    except Exception as e:
        error_msg = str(e).lower()
        if "429" in error_msg or "quota" in error_msg or "exhausted" in error_msg:
            raise HTTPException(status_code=429, detail="Google Gemini API rate limit reached. Please wait a minute before trying again.")
        raise HTTPException(status_code=500, detail="An internal server error occurred while processing your request.")
