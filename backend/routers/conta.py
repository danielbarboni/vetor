"""
conta.py — Account management endpoints (CTR-01 to CTR-04).

Endpoints:
  GET  /account/profile          — read profile (CTR-01)
  PATCH /account/profile         — update profile + avatar_url (CTR-01)
  GET  /account/preferences      — read preferences with defaults (CTR-03)
  PATCH /account/preferences     — update preferences (CTR-03)
  GET  /account/brokers          — list linked brokers (CTR-02)
  POST /account/brokers          — link a broker via MetaAPI (CTR-02)
  DELETE /account/brokers/{id}   — unlink a broker (CTR-02)
  GET  /account/credits          — credit balance

Sessions endpoint (CTR-04 / AUT-04) is in routers/auth.py and registered
under the same /account prefix — reused here per plan spec.

All routes are user-scoped via Depends(get_current_user).
Security: broker linking stores ONLY metaapi_account_id — NEVER raw MT5 creds (T-01).
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from auth.jwt_guard import get_current_user
from db import account_repo
from broker.provisioning import link_broker, unlink_broker

router = APIRouter()


# ── Pydantic models ────────────────────────────────────────────────────────────

class ProfileResponse(BaseModel):
    id: str
    full_name: str | None = None
    phone: str | None = None
    cpf_cnpj: str | None = None
    avatar_url: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    cpf_cnpj: str | None = None
    avatar_url: str | None = None


class PreferencesResponse(BaseModel):
    email_notifications_executions: bool = True
    email_notifications_stops: bool = True
    email_notifications_margin: bool = True
    default_simulator_type: str = "pessimista"
    decimal_separator: str = "comma"
    thousands_separator: str = "dot"
    currency_display: str = "BRL"


class PreferencesUpdate(BaseModel):
    email_notifications_executions: bool | None = None
    email_notifications_stops: bool | None = None
    email_notifications_margin: bool | None = None
    default_simulator_type: str | None = None
    decimal_separator: str | None = None
    thousands_separator: str | None = None
    currency_display: str | None = None


class BrokerResponse(BaseModel):
    id: str
    broker_name: str
    metaapi_account_id: str | None = None
    status: str
    created_at: str | None = None


class BrokerLinkRequest(BaseModel):
    login: str = Field(..., description="MT5 account login number")
    password: str = Field(..., description="MT5 password — forwarded to MetaAPI only, never stored")
    server: str = Field(..., description="MT5 server name (e.g. BTG-Demo)")
    broker_name: str = Field("BTG Pactual", description="Display name for the broker")


class BrokerLinkResponse(BaseModel):
    metaapi_account_id: str
    broker_name: str
    status: str


class CreditsResponse(BaseModel):
    balance: int
    updated_at: str | None = None


# ── Profile ───────────────────────────────────────────────────────────────────

@router.get(
    "/profile",
    response_model=ProfileResponse,
    summary="Get authenticated user profile (CTR-01)",
    tags=["account"],
)
async def get_profile(
    user_id: str = Depends(get_current_user),
) -> dict[str, Any]:
    """Return the profile for the authenticated user."""
    profile = account_repo.get_profile(user_id)
    if not profile:
        # Return a minimal profile shape when row doesn't exist yet
        return {"id": user_id}
    return profile


@router.patch(
    "/profile",
    response_model=ProfileResponse,
    summary="Update authenticated user profile (CTR-01)",
    tags=["account"],
)
async def update_profile(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user),
) -> dict[str, Any]:
    """Update allowed profile fields for the authenticated user."""
    fields = body.model_dump(exclude_none=True)
    updated = account_repo.update_profile(user_id, fields)
    if not updated:
        # Return current profile if update produced no changes
        profile = account_repo.get_profile(user_id)
        return profile or {"id": user_id}
    return updated


# ── Preferences ───────────────────────────────────────────────────────────────

@router.get(
    "/preferences",
    response_model=PreferencesResponse,
    summary="Get user preferences (CTR-03)",
    tags=["account"],
)
async def get_preferences(
    user_id: str = Depends(get_current_user),
) -> dict[str, Any]:
    """Return preferences with defaults applied where unset."""
    return account_repo.get_preferences(user_id)


@router.patch(
    "/preferences",
    response_model=PreferencesResponse,
    summary="Update user preferences (CTR-03)",
    tags=["account"],
)
async def update_preferences(
    body: PreferencesUpdate,
    user_id: str = Depends(get_current_user),
) -> dict[str, Any]:
    """Update and return the merged preferences for the authenticated user."""
    fields = body.model_dump(exclude_none=True)
    return account_repo.update_preferences(user_id, fields)


# ── Brokers ───────────────────────────────────────────────────────────────────

@router.get(
    "/brokers",
    response_model=list[BrokerResponse],
    summary="List linked broker connections (CTR-02)",
    tags=["account"],
)
async def get_brokers(
    user_id: str = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Return all broker connections for the authenticated user."""
    return account_repo.get_brokers(user_id)


@router.post(
    "/brokers",
    response_model=BrokerLinkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Link a broker via MetaAPI (CTR-02)",
    tags=["account"],
)
async def link_broker_endpoint(
    body: BrokerLinkRequest,
    user_id: str = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Provision a MetaAPI account and store ONLY the account ID in broker_connections.

    Security: raw MT5 credentials are forwarded to MetaAPI only and never persisted (T-01).
    """
    try:
        result = await link_broker(
            user_id=user_id,
            login=body.login,
            password=body.password,
            server=body.server,
            broker_name=body.broker_name,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"MetaAPI provisioning failed: {exc}",
        ) from exc
    return result


@router.delete(
    "/brokers/{connection_id}",
    status_code=status.HTTP_200_OK,
    summary="Unlink a broker connection (CTR-02)",
    tags=["account"],
)
async def unlink_broker_endpoint(
    connection_id: str,
    user_id: str = Depends(get_current_user),
) -> dict[str, Any]:
    """Set the broker connection status to 'unlinked'."""
    return await unlink_broker(user_id=user_id, connection_id=connection_id)


# ── Credits ───────────────────────────────────────────────────────────────────

@router.get(
    "/credits",
    response_model=CreditsResponse,
    summary="Get user credit balance",
    tags=["account"],
)
async def get_credits(
    user_id: str = Depends(get_current_user),
) -> dict[str, Any]:
    """Return the credit balance for the authenticated user."""
    return account_repo.get_credits(user_id)
