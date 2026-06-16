"""
Supabase JWT guard — FastAPI dependency.

Verifies the Supabase access token and returns sub (user_id UUID).
Supports both Supabase signing schemes:
  - ES256/RS256 — asymmetric "JWT signing keys" (default on new projects):
    verified against the project JWKS at
    {SUPABASE_URL}/auth/v1/.well-known/jwks.json (selected by `kid`).
  - HS256 — legacy shared secret: verified with SUPABASE_JWT_SECRET.
Never trust a client-supplied user_id (T-01-04).
"""
from __future__ import annotations

import threading

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from config import settings

security = HTTPBearer()

# In-process JWKS cache (Supabase rotates signing keys rarely).
_jwks_lock = threading.Lock()
_jwks_cache: dict | None = None


def _fetch_jwks(force: bool = False) -> dict:
    global _jwks_cache
    with _jwks_lock:
        if _jwks_cache is None or force:
            url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
            resp = httpx.get(url, timeout=10)
            resp.raise_for_status()
            _jwks_cache = resp.json()
        return _jwks_cache


def _jwk_for_kid(kid: str | None) -> dict | None:
    if not kid:
        return None
    for key in _fetch_jwks().get("keys", []):
        if key.get("kid") == kid:
            return key
    # Key may have rotated — refresh once and retry.
    for key in _fetch_jwks(force=True).get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Validate the Supabase JWT from Authorization: Bearer <token>.

    Returns the authenticated user_id (sub claim, UUID string).
    Raises HTTP 401 on missing token, invalid signature, wrong audience,
    expired token, or any other JWTError.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        raise credentials_exception

    token = credentials.credentials

    try:
        header = jwt.get_unverified_header(token)
    except JWTError:
        raise credentials_exception
    alg = header.get("alg")

    try:
        if alg == "HS256":
            if not settings.SUPABASE_JWT_SECRET:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Authentication service not configured (missing JWT secret)",
                )
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            # Asymmetric (ES256/RS256) — verify against the project JWKS.
            if not settings.SUPABASE_URL:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Authentication service not configured (missing SUPABASE_URL)",
                )
            jwk = _jwk_for_kid(header.get("kid"))
            if jwk is None:
                raise credentials_exception
            payload = jwt.decode(
                token,
                jwk,
                algorithms=[alg],
                audience="authenticated",
            )
    except HTTPException:
        raise
    except (JWTError, httpx.HTTPError):
        raise credentials_exception

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise credentials_exception

    return user_id
