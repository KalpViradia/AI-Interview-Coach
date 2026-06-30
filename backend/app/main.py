"""
AI Interview Coach — FastAPI Backend

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
    title="AI Interview Coach",
    description="AI-powered interview preparation with multi-agent orchestration",
    version="0.1.0",
    lifespan=lifespan,
)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "0.1.0"}

from app.api import sessions, upload, auth, resume_chat, resumes
from app.agents.graph import builder

# Setup slowapi rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://127.0.0.1:3000",  # Browsers treat localhost and 127.0.0.1 as different origins
    ],
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
