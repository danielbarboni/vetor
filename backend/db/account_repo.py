"""
account_repo.py — User-scoped data access for account management.

Provides read/update for:
- profiles         (CTR-01 personal data + avatar_url)
- user_preferences (CTR-03 notification + display preferences)
- broker_connections (CTR-02 status read)
- user_credits     (credit balance)

All operations are scoped to the calling user_id — never expose other users' data.
Raw MT5 credentials are NEVER stored here (T-01: credential exposure mitigation).
"""
from __future__ import annotations

from typing import Any

from db.supabase_client import supabase


# ── Default preferences applied when no row exists ────────────────────────────

DEFAULT_PREFERENCES: dict[str, Any] = {
    "email_notifications_executions": True,
    "email_notifications_stops": True,
    "email_notifications_margin": True,
    "default_simulator_type": "pessimista",
    "decimal_separator": "comma",  # "comma" = 1.234,56 (BR) | "dot" = 1,234.56 (US)
    "thousands_separator": "dot",
    "currency_display": "BRL",
}


# ── Profile ───────────────────────────────────────────────────────────────────

def get_profile(user_id: str) -> dict[str, Any] | None:
    """Return the profile row for user_id, or None if not found."""
    res = (
        supabase.table("profiles")
        .select("id, full_name, phone, cpf_cnpj, avatar_url, created_at, updated_at")
        .eq("id", user_id)
        .execute()
    )
    if res.data:
        return res.data[0]
    return None


def update_profile(user_id: str, fields: dict[str, Any]) -> dict[str, Any] | None:
    """
    Update allowed profile fields for user_id.

    Only whitelisted keys are applied — callers cannot inject arbitrary columns.
    Returns the updated row, or None on error.
    """
    allowed = {"full_name", "phone", "cpf_cnpj", "avatar_url"}
    payload = {k: v for k, v in fields.items() if k in allowed}
    if not payload:
        return None
    res = (
        supabase.table("profiles")
        .update(payload)
        .eq("id", user_id)
        .execute()
    )
    if res.data:
        return res.data[0]
    return None


# ── Preferences ───────────────────────────────────────────────────────────────

def get_preferences(user_id: str) -> dict[str, Any]:
    """
    Return preferences for user_id.

    Merges defaults with stored values — callers always receive a complete object
    even if no preferences row exists yet (CTR-03).
    """
    res = (
        supabase.table("user_preferences")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    prefs = dict(DEFAULT_PREFERENCES)
    if res.data:
        stored = res.data[0]
        for key in DEFAULT_PREFERENCES:
            if key in stored and stored[key] is not None:
                prefs[key] = stored[key]
    return prefs


def update_preferences(user_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    """
    Upsert preferences for user_id.

    Only whitelisted keys are applied. Returns the merged preferences object.
    """
    allowed = set(DEFAULT_PREFERENCES.keys())
    payload = {k: v for k, v in fields.items() if k in allowed}
    if not payload:
        return get_preferences(user_id)

    # Check if row exists
    existing = (
        supabase.table("user_preferences")
        .select("user_id")
        .eq("user_id", user_id)
        .execute()
    )
    payload["user_id"] = user_id

    if existing.data:
        supabase.table("user_preferences").update(payload).eq("user_id", user_id).execute()
    else:
        supabase.table("user_preferences").insert(payload).execute()

    return get_preferences(user_id)


# ── Broker connections ─────────────────────────────────────────────────────────

def get_brokers(user_id: str) -> list[dict[str, Any]]:
    """
    Return all broker_connections for user_id.

    Returns only non-sensitive fields — never raw credentials (T-01).
    """
    res = (
        supabase.table("broker_connections")
        .select("id, user_id, broker_name, metaapi_account_id, status, created_at, updated_at")
        .eq("user_id", user_id)
        .execute()
    )
    return res.data or []


# ── Credits ───────────────────────────────────────────────────────────────────

def get_credits(user_id: str) -> dict[str, Any]:
    """Return the credit balance for user_id."""
    res = (
        supabase.table("user_credits")
        .select("balance, updated_at")
        .eq("user_id", user_id)
        .execute()
    )
    if res.data:
        return res.data[0]
    return {"balance": 0, "updated_at": None}
