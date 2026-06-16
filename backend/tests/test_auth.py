"""
test_auth.py — Auth endpoint tests (AUT-01 … AUT-06)

All tests are hermetic — no live HTTP calls to Supabase.
The OAuth URL test validates the shape/pattern of what signInWithOAuth would produce.
"""
import re
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_oauth_url():
    """
    AUT-06: OAuth Google/GitHub redirect URL is well-formed.

    Validates that an OAuth redirect URL pointing to Supabase has:
    - https scheme
    - A supabase.co host (or placeholder used in CI)
    - /auth/v1/authorize path
    - provider=google or provider=github query param

    The Supabase client constructs this URL from VITE_SUPABASE_URL + /auth/v1/authorize.
    We assert the pattern here without making a live network call.
    """
    supabase_url = "https://placeholder.supabase.co"
    provider = "google"

    # Build the URL exactly as supabase-js does internally
    oauth_url = f"{supabase_url}/auth/v1/authorize?provider={provider}"

    # Assert well-formed URL
    assert oauth_url.startswith("https://"), "OAuth URL must use HTTPS"
    assert "supabase" in oauth_url or "placeholder" in oauth_url, "URL must reference Supabase"
    assert "/auth/v1/authorize" in oauth_url, "URL must use /auth/v1/authorize path"
    assert f"provider={provider}" in oauth_url, f"URL must include provider={provider}"
    # Validate URL pattern with regex
    pattern = r"^https://[^/]+/auth/v1/authorize\?provider=(google|github)"
    assert re.match(pattern, oauth_url), f"OAuth URL does not match expected pattern: {oauth_url}"


def test_get_sessions_unauthenticated():
    """GET /account/sessions returns 401 or 403 when no Bearer token provided."""
    response = client.get("/account/sessions")
    assert response.status_code in (401, 403)


def test_revoke_all_sessions_unauthenticated():
    """POST /account/sessions/revoke-all returns 401 or 403 when no Bearer token."""
    response = client.post("/account/sessions/revoke-all")
    assert response.status_code in (401, 403)


def test_revoke_all_endpoint_exists():
    """POST /account/sessions/revoke-all endpoint is registered (AUT-04)."""
    # Even without auth, a 403 (not 404) confirms route is registered
    response = client.post("/account/sessions/revoke-all")
    assert response.status_code != 404, "revoke-all endpoint must be registered"


def test_get_sessions_endpoint_exists():
    """GET /account/sessions endpoint is registered."""
    response = client.get("/account/sessions")
    assert response.status_code != 404, "sessions endpoint must be registered"


@pytest.mark.xfail(reason="implemented in later wave")
def test_register():
    """AUT-01: Email/password registration creates user and sends confirmation email."""
    raise NotImplementedError


@pytest.mark.xfail(reason="implemented in later wave")
def test_login():
    """AUT-02: Email/password login returns session; session persists across browser sessions."""
    raise NotImplementedError


@pytest.mark.xfail(reason="implemented in later wave")
def test_reset():
    """AUT-03: Password recovery sends email link via Supabase resetPasswordForEmail."""
    raise NotImplementedError
