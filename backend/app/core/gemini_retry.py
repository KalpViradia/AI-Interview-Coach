"""
Gemini Retry Wrapper — exponential backoff for 429 rate limit errors.

Usage:
    from app.core.gemini_retry import with_retry
    result = await with_retry(chain.ainvoke, {"key": "value"})
"""

import asyncio
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)

async def with_retry(async_fn, *args, max_retries: int = 4, **kwargs):
    """
    Wraps any async LangChain/Gemini call with exponential backoff.
    Retries ONLY on 429 ResourceExhausted errors.
    Raises HTTPException(429) with a user-friendly message after all retries.
    
    Backoff schedule: 2s → 4s → 8s → 16s
    """
    last_error = None
    
    for attempt in range(max_retries):
        try:
            return await async_fn(*args, **kwargs)
            
        except Exception as e:
            error_str = str(e).lower()
            is_rate_limit = (
                "429" in error_str
                or "quota" in error_str
                or "resource_exhausted" in error_str
                or "resourceexhausted" in error_str
                or "rate limit" in error_str
            )
            
            if not is_rate_limit:
                # Not a rate limit error — don't retry, re-raise immediately
                logger.error(f"Gemini non-retryable error: {e}")
                raise
            
            last_error = e
            wait_seconds = 2 ** (attempt + 1)  # 2, 4, 8, 16
            
            if attempt < max_retries - 1:
                logger.warning(
                    f"Gemini 429 on attempt {attempt + 1}/{max_retries}. "
                    f"Retrying in {wait_seconds}s..."
                )
                await asyncio.sleep(wait_seconds)
            else:
                logger.error(
                    f"Gemini rate limit: all {max_retries} retries exhausted."
                )
    
    # All retries failed
    raise HTTPException(
        status_code=429,
        detail=(
            "Google Gemini API rate limit reached. "
            "The system retried automatically but the quota is still exhausted. "
            "Please wait a minute before trying again."
        )
    )
