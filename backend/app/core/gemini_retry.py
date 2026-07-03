"""
Gemini Retry Wrapper — exponential backoff for 429 rate limit errors.

Usage:
    from app.core.gemini_retry import with_retry
    result = await with_retry(chain.ainvoke, {"key": "value"})
"""

import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Any, Optional
from fastapi import HTTPException

logger = logging.getLogger(__name__)

@dataclass
class GeminiResult:
    data: Any
    input_tokens: int
    output_tokens: int
    latency: float

# Global circuit breaker state
_circuit = {
    "failure_count": 0,
    "open_until": None,
    "threshold": 3,
    "cooldown": 30
}

async def with_retry(async_fn, *args, max_retries: int = 4, timeout: int = 45, **kwargs):
    """
    Wraps any async LangChain/Gemini call with exponential backoff.
    Retries ONLY on 429 ResourceExhausted errors.
    Raises HTTPException(429) with a user-friendly message after all retries.
    
    Backoff schedule: 2s → 4s → 8s → 16s
    """
    now = time.time()
    
    # Check circuit breaker
    if _circuit["open_until"] and now < _circuit["open_until"]:
        remaining = int(_circuit["open_until"] - now)
        logger.warning(f"Circuit breaker open. Rejecting request. Cooldown: {remaining}s")
        raise HTTPException(
            status_code=429,
            detail={
                "error": "RATE_LIMIT",
                "provider": "Google Gemini",
                "message": f"The AI service is experiencing heavy load. Please wait {remaining} seconds before trying again.",
                "retry_after": remaining,
                "recoverable": True
            }
        )
    elif _circuit["open_until"] and now >= _circuit["open_until"]:
        # Cooldown passed, half-open state
        _circuit["open_until"] = None
        _circuit["failure_count"] = 0
        logger.info("Circuit breaker closed (cooldown finished).")
        
    last_error = None
    
    for attempt in range(max_retries):
        try:
            start_time = time.time()
            # Wrap the actual call with asyncio.wait_for to enforce timeout
            raw_result = await asyncio.wait_for(
                async_fn(*args, **kwargs),
                timeout=timeout
            )
            latency = time.time() - start_time
            
            # Extract token counts and data
            input_tokens = 0
            output_tokens = 0
            data = raw_result
            
            # 1. LangChain include_raw=True format
            if isinstance(raw_result, dict) and "raw" in raw_result and "parsed" in raw_result:
                data = raw_result["parsed"]
                meta = getattr(raw_result["raw"], "usage_metadata", {})
                if meta:
                    input_tokens = meta.get("input_tokens", 0)
                    output_tokens = meta.get("output_tokens", 0)
            # 2. Raw AIMessage (no structured output)
            elif hasattr(raw_result, "usage_metadata") and raw_result.usage_metadata:
                meta = raw_result.usage_metadata
                if isinstance(meta, dict):
                    input_tokens = meta.get("input_tokens", 0)
                    output_tokens = meta.get("output_tokens", 0)
                else:
                    input_tokens = getattr(meta, "input_tokens", 0)
                    output_tokens = getattr(meta, "output_tokens", 0)
            
            # Success! Reset circuit breaker
            if _circuit["failure_count"] > 0:
                _circuit["failure_count"] = 0
                
            return GeminiResult(
                data=data,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                latency=latency
            )
            
        except asyncio.TimeoutError:
            # Timeout is generally not retryable at the same level because 
            # if it took >45s, doing it again right away usually also takes >45s.
            logger.error(f"Gemini API request timed out after {timeout} seconds.")
            raise HTTPException(
                status_code=504,
                detail={
                    "error": "TIMEOUT",
                    "provider": "Google Gemini",
                    "message": f"The AI service took too long to respond ({timeout}s). Please try again later.",
                    "recoverable": True
                }
            )
            
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
                
                # Increment circuit breaker failures
                _circuit["failure_count"] += 1
                if _circuit["failure_count"] >= _circuit["threshold"]:
                    _circuit["open_until"] = time.time() + _circuit["cooldown"]
                    logger.error(f"CIRCUIT BREAKER TRIPPED! Opening for {_circuit['cooldown']}s")
    
    # All retries failed
    raise HTTPException(
        status_code=429,
        detail={
            "error": "RATE_LIMIT",
            "provider": "Google Gemini",
            "message": "The AI service has temporarily reached its request limit. Please wait about 20-30 seconds before trying again.",
            "retry_after": 20,
            "recoverable": True
        }
    )
