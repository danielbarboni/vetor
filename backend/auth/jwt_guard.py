"""
Supabase JWT guard — FastAPI dependency.

Pattern: HTTPBearer; decode with SUPABASE_JWT_SECRET, audience="authenticated";
return sub (user_id UUID).  Never trust a client-supplied user_id (T-01-04).
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from config import settings

security = HTTPBearer()


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

    if not settings.SUPABASE_JWT_SECRET:
        # Fail closed: if the secret is not configured, reject all requests.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service not configured",
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError:
        raise credentials_exception

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise credentials_exception

    return user_id
