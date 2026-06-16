"""
test_broker.py — Nyquist gate: CTR-02

Tests for broker connection provisioning (BTG/MetaAPI link/unlink).
Implemented in later plan (routers/conta.py + broker/metaapi_adapter.py wave).
"""
import pytest


@pytest.mark.xfail(reason="implemented in later wave")
def test_provision():
    """CTR-02: Linking a BTG account via MetaAPI provisions the connection and stores status."""
    raise NotImplementedError
