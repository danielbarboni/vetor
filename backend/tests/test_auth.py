"""
test_auth.py — Nyquist gate: AUT-01 … AUT-06

Tests for authentication flows (register, login, password reset, OAuth).
Implemented in later plan (routers/auth.py wave).
"""
import pytest


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


@pytest.mark.xfail(reason="implemented in later wave")
def test_oauth_url():
    """AUT-06: OAuth Google/GitHub returns a valid redirect URL from Supabase signInWithOAuth."""
    raise NotImplementedError
