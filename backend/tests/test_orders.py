"""
test_orders.py — Nyquist gate: EXE-05, EXE-06

Tests for order persistence and idempotency.
Implemented in later plan (execution/orders wave).
"""
import pytest


@pytest.mark.xfail(reason="implemented in later wave")
def test_order_persist():
    """EXE-05: All orders are persisted with timestamp, price, qty, type, status, class."""
    raise NotImplementedError


@pytest.mark.xfail(reason="implemented in later wave")
def test_idempotency():
    """EXE-06: Replaying the same clientOrderId does not duplicate the order row."""
    raise NotImplementedError
