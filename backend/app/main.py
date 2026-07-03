"""
SkillMock — FastAPI Backend

Entry point for the application.
"""

import sys
import asyncio
import contextlib
from psycopg_pool import AsyncConnectionPool
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

# Fix for psycopg async mode on Windows
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.core.config import get_settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from app.core.rate_limit import limiter
from app.core.logger import logger

settings = get_settings()

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: sets up the Postgres connection pool for the checkpointer."""
    # Convert SQLAlchemy URL to psycopg connection string format for psycopg_pool
    # e.g. postgresql+psycopg:// -> postgresql://
    conn_info = settings.database_url.replace("+psycopg", "").replace("+asyncpg", "")

    import psycopg
    async def custom_check(conn):
        try:
            await conn.execute("SELECT 1")
        except Exception as e:
            raise psycopg.OperationalError(f"Connection dead: {e}")

    async with AsyncConnectionPool(
        conninfo=conn_info,
        max_size=20,
        max_idle=120,  # Neon drops connections after 5 mins, so recycle them before that
        check=custom_check,
        kwargs={
            "autocommit": True,
            "prepare_threshold": 0,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        },
    ) as pool:
        checkpointer = AsyncPostgresSaver(pool)

        # Ensure the checkpointer tables exist
        await checkpointer.setup()

        app.state.pool = pool
        app.state.graph = builder.compile(checkpointer=checkpointer)

        logger.info("Application startup complete. Graph and DB initialized.")
        yield

app = FastAPI(
    title="SkillMock",
    description="AI-powered interview preparation with multi-agent orchestration",
    version="0.1.0",
    lifespan=lifespan,
)

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.db import get_db
from sqlalchemy import text

@app.get("/api/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint. Verifies external dependencies."""
    components = {
        "database": "disconnected",
        "chromadb": "disconnected",
        "gemini_api_key": "configured" if settings.gemini_api_key else "missing"
    }
    
    # Check Database
    try:
        await db.execute(text("SELECT 1"))
        components["database"] = "connected"
    except Exception as e:
        components["database"] = f"error: {str(e)}"
        
    # Check ChromaDB
    try:
        from app.rag.resume_chat import chroma_client
        chroma_client.heartbeat()
        components["chromadb"] = "connected"
    except Exception as e:
        components["chromadb"] = f"error: {str(e)}"
        
    status = "ok" if all(v == "connected" or v == "configured" for v in components.values()) else "degraded"
    
    return {
        "status": status,
        "version": "0.1.0",
        "components": components
    }

from app.core.ats_cache import ats_cache
from app.core.gemini_retry import _circuit
import time

@app.get("/api/stats")
async def system_stats():
    """Returns system statistics like cache hit rates and circuit breaker status."""
    return {
        "ats_cache": ats_cache.stats(),
        "gemini_circuit_breaker": {
            "failure_count": _circuit["failure_count"],
            "is_open": _circuit["open_until"] is not None and time.time() < _circuit["open_until"],
            "threshold": _circuit["threshold"]
        }
    }

from app.api import sessions, upload, auth, resume_chat, resumes, users
from app.agents.graph import builder

# Setup slowapi rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Construct allowed origins dynamically
allowed_origins = [
    settings.frontend_url,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if settings.cors_origins:
    allowed_origins.extend([origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()])

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://ai-interview-coach.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(auth.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(resume_chat.router, prefix="/api")
app.include_router(resumes.router, prefix="/api")
app.include_router(users.router, prefix="/api")

# Global Exception Handler for Unhandled Exceptions (Fixes CORS on 500)
from fastapi import Request
from fastapi.responses import JSONResponse
from app.services.embedding_service import EmbeddingGenerationException

@app.exception_handler(EmbeddingGenerationException)
async def embedding_generation_exception_handler(request: Request, exc: EmbeddingGenerationException):
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "EMBEDDING_GENERATION_FAILED",
            "provider": "Google Gemini",
            "message": "Unable to generate document embeddings.",
            "recoverable": True
        },
        headers=headers
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
        headers=headers
    )
