"""
provisioning.py — MetaAPI broker account provisioning.

Security contract (T-01 — MT5 credential exposure mitigation):
- link_broker() accepts login + password only long enough to call MetaAPI.
- It stores ONLY metaapi_account_id + status in broker_connections.
- The raw MT5 password is NEVER written to the database.

MetaAPI handles credential storage on their side via their SDK.
"""
from __future__ import annotations

import os
from typing import Any

from db.supabase_client import supabase

# MetaAPI token comes from env — absent in unit tests (mock covers that path)
_METAAPI_TOKEN = os.environ.get("METAAPI_TOKEN", "")

# Import at module level so unittest.mock.patch can find it.
# Falls back to a placeholder class in unit-test environments where the SDK
# is not installed — the test provides its own mock via patch().
try:
    from metaapi_cloud_sdk import MetaApi  # type: ignore[import]
except ImportError:
    class MetaApi:  # type: ignore[no-redef]
        """Placeholder — replaced by mock in unit tests."""
        def __init__(self, token: str) -> None:
            raise RuntimeError(
                "metaapi_cloud_sdk not installed. Use mock in tests or install SDK in production."
            )


async def link_broker(
    user_id: str,
    login: str,
    password: str,  # noqa: S107  (used only to provision via MetaAPI — never stored)
    server: str,
    broker_name: str = "BTG Pactual",
) -> dict[str, Any]:
    """
    Provision a MetaAPI trading account and store the resulting account ID.

    Steps:
    1. Call MetaAPI to create/retrieve a cloud account for the given MT5 credentials.
    2. Extract the resulting account_id (UUID string from MetaAPI).
    3. Insert into broker_connections: user_id, broker_name, metaapi_account_id, status.
    4. Return the record — NEVER including the raw MT5 login/password.

    Security: `password` is forwarded to MetaAPI only and is NOT persisted locally.
    """
    api = MetaApi(_METAAPI_TOKEN)
    account = await api.metatrader_account_api.create_account({
        "name": f"{broker_name} — {login}",
        "type": "cloud",
        "login": login,
        "password": password,  # sent to MetaAPI only, never stored locally
        "server": server,
        "platform": "mt5",
        "magic": 0,
    })

    metaapi_account_id: str = account.id

    # Store ONLY credential-free fields (T-01 enforcement)
    row: dict[str, Any] = {
        "user_id": user_id,
        "broker_name": broker_name,
        "metaapi_account_id": metaapi_account_id,
        "status": "provisioning",
    }
    # Explicit assertion: no password field in the persisted row
    assert "password" not in row, "BUG: password must never be persisted (T-01)"

    supabase.table("broker_connections").insert(row).execute()

    return {
        "metaapi_account_id": metaapi_account_id,
        "broker_name": broker_name,
        "status": "provisioning",
    }


async def unlink_broker(user_id: str, connection_id: str) -> dict[str, Any]:
    """
    Set a broker connection status to 'unlinked'.

    Does not call MetaAPI — the cloud account remains but is disassociated
    from the user's active connections.
    """
    supabase.table("broker_connections").update({"status": "unlinked"}).eq(
        "id", connection_id
    ).eq("user_id", user_id).execute()  # user_id guard: never unlink another user's broker

    return {"id": connection_id, "status": "unlinked"}
