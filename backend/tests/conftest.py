"""
pytest fixtures for Vetor backend tests.

Provides:
- test_supabase   : a lightweight Supabase client pointed at a test project,
                    or a mock when env vars are absent (unit test mode).
- mock_metaapi    : AsyncMock mimicking MetaAPIAdapter surface.
- auth_token      : a signed test JWT for protected-route tests (requires
                    SUPABASE_JWT_SECRET in env; skips otherwise).
- test_client     : HTTPX AsyncClient wrapping the FastAPI app.
"""
from __future__ import annotations

import os
from datetime import datetime, timezone, timedelta
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from main import app


# ── test_supabase fixture ─────────────────────────────────────────────────────

@pytest.fixture
def test_supabase():
    """
    Return a Supabase client for test use.

    When SUPABASE_URL + SUPABASE_SERVICE_KEY are set (integration test mode),
    returns a real client pointed at the test project.
    When absent (unit test mode), returns a MagicMock that stubs the client
    surface so unit tests can run offline without network access.
    """
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")

    if url and key and not url.startswith("https://placeholder"):
        from supabase import create_client
        return create_client(url, key)

    # Unit-test fallback: mock the supabase client surface
    mock_client = MagicMock()
    mock_client.table.return_value = mock_client
    mock_client.select.return_value = mock_client
    mock_client.insert.return_value = mock_client
    mock_client.update.return_value = mock_client
    mock_client.delete.return_value = mock_client
    mock_client.eq.return_value = mock_client
    mock_client.execute.return_value = MagicMock(data=[], error=None)
    return mock_client


# ── mock_metaapi fixture ───────────────────────────────────────────────────────

@pytest.fixture
def mock_metaapi():
    """
    AsyncMock mimicking the MetaAPIAdapter surface used by RobotEngine.

    Methods:
      connect()           → None
      subscribe(account)  → None
      place_order(order)  → {"orderId": "test-order-id"}
      get_positions()     → []
      get_orders()        → []
      disconnect()        → None
    """
    adapter = AsyncMock()
    adapter.connect = AsyncMock(return_value=None)
    adapter.subscribe = AsyncMock(return_value=None)
    adapter.place_order = AsyncMock(return_value={"orderId": "test-order-id"})
    adapter.get_positions = AsyncMock(return_value=[])
    adapter.get_orders = AsyncMock(return_value=[])
    adapter.disconnect = AsyncMock(return_value=None)
    return adapter


# ── auth_token fixture ────────────────────────────────────────────────────────

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.fixture
def auth_token() -> str:
    """
    Return a signed JWT that passes the get_current_user guard.

    Requires SUPABASE_JWT_SECRET to be set in the environment.
    Skips the test when the secret is absent (safe for CI without live secrets).
    """
    secret = os.getenv("SUPABASE_JWT_SECRET", "")
    if not secret:
        pytest.skip("SUPABASE_JWT_SECRET not set — skipping auth-dependent test")

    from jose import jwt

    now = datetime.now(timezone.utc)
    payload = {
        "sub": TEST_USER_ID,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=1)).timestamp()),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


# ── test_client fixture ───────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def test_client() -> AsyncGenerator[AsyncClient, None]:
    """HTTPX AsyncClient backed by the FastAPI ASGI app (no real network)."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as client:
        yield client
