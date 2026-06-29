"""
JWT authentication utilities for verifying NextAuth tokens.

NextAuth signs JWTs with the NEXTAUTH_SECRET using HS256.
This module verifies those tokens on the backend to extract user identity.

Two dependencies are provided:
  - get_current_user: REQUIRES a valid token; raises 401 if missing/invalid
  - get_optional_user: Returns user info if a valid token is present, None otherwise (for guest mode)
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from pydantic import BaseModel

from app.core.config import get_settings

# NextAuth uses HS256 by default
ALGORITHM = "HS256"

# HTTPBearer extracts the token from the Authorization: Bearer <token> header
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    """Represents the authenticated user extracted from the JWT."""
    id: str
    email: Optional[str] = None
    name: Optional[str] = None


def _decode_token(token: str) -> dict:
    """Decode and verify a NextAuth JWT token.
    
    NextAuth v4 stores user info under the 'sub' claim (user id)
    and additional fields like 'email' and 'name' in the token body.
    """
    settings = get_settings()
    
    if not settings.nextauth_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="NEXTAUTH_SECRET is not configured on the backend."
        )
    
    try:
        payload = jwt.decode(
            token,
            settings.nextauth_secret,
            algorithms=[ALGORITHM],
            options={
                # NextAuth tokens may not always have standard 'exp' claim
                # depending on config, so we allow missing exp
                "verify_exp": True,
                "verify_aud": False,
            }
        )
        return payload
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser:
    """FastAPI dependency that requires a valid JWT token.
    
    Use this for endpoints that MUST be authenticated (e.g., GET /sessions).
    Raises 401 if no token or invalid token.
    """
    payload = _decode_token(credentials.credentials)
    
    # NextAuth stores user id in 'sub' and also in 'id'
    user_id = payload.get("id") or payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain user identification",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return CurrentUser(
        id=str(user_id),
        email=payload.get("email"),
        name=payload.get("name"),
    )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
) -> Optional[CurrentUser]:
    """FastAPI dependency that optionally extracts user from JWT.
    
    Use this for endpoints that support both authenticated and guest mode
    (e.g., POST /sessions — authenticated users get data saved to DB,
    guests can still use the feature without persistence).
    
    Returns None if no token is present or if the token is invalid.
    """
    if credentials is None:
        return None
    
    try:
        payload = _decode_token(credentials.credentials)
        user_id = payload.get("id") or payload.get("sub")
        if not user_id:
            return None
        return CurrentUser(
            id=str(user_id),
            email=payload.get("email"),
            name=payload.get("name"),
        )
    except HTTPException:
        # Invalid token in optional mode → treat as guest
        return None
