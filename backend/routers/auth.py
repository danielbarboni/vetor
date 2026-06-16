"""
auth.py — Account session endpoints.

Endpoints:
  GET  /account/sessions          — login history shape for authenticated user (AUT-04 surface)
  POST /account/sessions/revoke-all — global sign-out: instructs client to call signOut(scope='global')
                                      (AUT-04)

All routes are user-scoped via Depends(get_current_user).
The actual Supabase global sign-out is performed client-side by the frontend store
(supabase.auth.signOut({ scope: 'global' })) after receiving the 200 response here.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from auth.jwt_guard import get_current_user

router = APIRouter()


# ── Response models ────────────────────────────────────────────────────────────

class SessionEntry(BaseModel):
    """A single login session entry (login history shape for AUT-04)."""
    session_id: str
    created_at: datetime
    device: str
    ip: str
    is_current: bool


class SessionsResponse(BaseModel):
    sessions: List[SessionEntry]


class RevokeAllResponse(BaseModel):
    message: str
    revoked_at: datetime


# ── GET /account/sessions ──────────────────────────────────────────────────────

@router.get(
    "/sessions",
    response_model=SessionsResponse,
    summary="Get login history for authenticated user",
    tags=["auth"],
)
async def get_sessions(
    user_id: str = Depends(get_current_user),
) -> SessionsResponse:
    """
    Returns a placeholder login history for the authenticated user.

    In production this would query Supabase auth.sessions (admin API) or a local
    sessions log table. For now returns a representative shape so the frontend
    can wire up the UI (AUT-04 / CTR-04).
    """
    # Placeholder: real implementation queries Supabase admin API or a sessions table.
    # Returning representative shape so UI can be built against the contract.
    now = datetime.now(timezone.utc)
    return SessionsResponse(
        sessions=[
            SessionEntry(
                session_id=f"session-{user_id[:8]}",
                created_at=now,
                device="Web — Chrome",
                ip="0.0.0.0",
                is_current=True,
            )
        ]
    )


# ── POST /account/sessions/revoke-all ─────────────────────────────────────────

@router.post(
    "/sessions/revoke-all",
    response_model=RevokeAllResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke all sessions (global sign-out) — AUT-04",
    tags=["auth"],
)
async def revoke_all_sessions(
    user_id: str = Depends(get_current_user),
) -> RevokeAllResponse:
    """
    Instructs the client to perform a global sign-out (scope='global') via Supabase Auth.

    The frontend auth store calls supabase.auth.signOut({ scope: 'global' }) after
    receiving this 200 response, which invalidates all refresh tokens for the user
    across all devices (AUT-04).
    """
    return RevokeAllResponse(
        message="All sessions revoked. Please sign in again.",
        revoked_at=datetime.now(timezone.utc),
    )
