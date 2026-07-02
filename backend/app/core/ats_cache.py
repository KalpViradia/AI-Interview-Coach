"""
Shared ATS Cache Service — used by both /ats-check and /sessions endpoints.

Provides an LRU cache with TTL for ATS analysis results (candidate_profile
including ats_breakdown), keyed by SHA-256 of (resume_text + jd_text).

This replaces the volatile per-endpoint in-memory dict that previously existed
only in sessions.py. Now both the standalone ATS check and the interview
session creation share the same cache, preventing duplicate Gemini calls.
"""

import hashlib
import time
import logging
from collections import OrderedDict
from typing import Optional

logger = logging.getLogger(__name__)

# TTL in seconds (1 hour). ATS results for the same resume+JD pair
# are unlikely to change within this window.
_CACHE_TTL = 3600
_CACHE_MAX_SIZE = 500


class ATSCache:
    """Thread-safe LRU cache with TTL for ATS/candidate_profile results."""

    def __init__(self, max_size: int = _CACHE_MAX_SIZE, ttl: int = _CACHE_TTL):
        self._cache: OrderedDict[str, tuple[dict, float]] = OrderedDict()
        self._max_size = max_size
        self._ttl = ttl

    @staticmethod
    def make_key(resume_text: str, jd_text: str) -> str:
        """Generate a deterministic cache key from resume + JD text."""
        return hashlib.sha256(
            (resume_text + jd_text).encode("utf-8")
        ).hexdigest()

    def get(self, key: str) -> Optional[dict]:
        """Return cached profile or None if missing/expired."""
        if key not in self._cache:
            return None

        value, timestamp = self._cache[key]
        if time.time() - timestamp > self._ttl:
            # Expired — evict and return miss
            del self._cache[key]
            logger.info(f"ATS Cache EXPIRED for key {key[:12]}...")
            return None

        # Move to end (most recently used)
        self._cache.move_to_end(key)
        logger.info(f"ATS Cache HIT for key {key[:12]}...")
        return value

    def put(self, key: str, value: dict) -> None:
        """Store a result in the cache."""
        self._cache[key] = (value, time.time())
        self._cache.move_to_end(key)

        # Evict oldest if over capacity
        while len(self._cache) > self._max_size:
            evicted_key, _ = self._cache.popitem(last=False)
            logger.info(f"ATS Cache EVICTED key {evicted_key[:12]}...")

        logger.info(f"ATS Cache STORED for key {key[:12]}... (size={len(self._cache)})")


# Global singleton — imported by sessions.py, resumes.py, and any other consumer.
ats_cache = ATSCache()
