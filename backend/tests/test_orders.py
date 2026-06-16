"""
test_orders.py — EXE-05 and EXE-06 order persistence + idempotency.
"""
from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest

from db.writer import SupabaseWriter, make_client_order_id, make_metaapi_client_id


# ── Fixtures ──────────────────────────────────────────────────────────────────

def _make_supabase_mock(raise_on_insert: bool = False, duplicate: bool = False):
    """Build a Supabase mock that records inserted rows."""
    rows_store = {}  # client_order_id → row

    def _insert(row):
        coid = row.get("client_order_id", "")
        if duplicate and coid in rows_store:
            raise Exception("unique constraint violation (23505)")
        if raise_on_insert:
            raise Exception("DB error")
        rows_store[coid] = row
        mock = MagicMock()
        mock.execute.return_value = MagicMock(data=[row], error=None)
        return mock

    def _select(cols):
        mock = MagicMock()

        def _eq_user(col, val):
            eq_mock = MagicMock()
            eq_mock.execute.return_value = MagicMock(data=[], error=None)
            return eq_mock

        mock.eq = _eq_user
        mock.execute.return_value = MagicMock(data=[], error=None)
        return mock

    def _update(data):
        mock = MagicMock()
        mock.eq = lambda col, val: MagicMock(execute=lambda: MagicMock(data=[], error=None))
        return mock

    client = MagicMock()
    client.table.return_value.select.side_effect = _select
    client.table.return_value.insert.side_effect = _insert
    client.table.return_value.update.side_effect = _update
    # expose store for assertions
    client._rows = rows_store
    return client


# ── test_order_persist (EXE-05) ───────────────────────────────────────────────

def test_order_persist():
    """EXE-05: Persisted order has timestamp, price, qty, type, status, class, contract."""
    mock_db = MagicMock()
    inserted = {}

    def _do_insert(row):
        inserted.update(row)
        m = MagicMock()
        m.execute.return_value = MagicMock(data=[row], error=None)
        return m

    mock_db.table.return_value.insert.side_effect = _do_insert

    writer = SupabaseWriter(mock_db)
    signal_ts = datetime.now(timezone.utc).isoformat()

    row = writer.persist_order(
        user_id="user-1",
        robot_id="robot-1",
        signal_timestamp=signal_ts,
        effective_contract="WINM26",
        side="buy",
        qty=1,
        fill_price=127_500.0,
        order_class="entry",
        status="QUEUED",
    )

    # EXE-05: all required fields present
    assert row["user_id"] == "user-1"
    assert row["robot_id"] == "robot-1"
    assert row["effective_contract"] == "WINM26"
    assert row["side"] == "buy"
    assert row["qty"] == 1
    assert row["fill_price"] == 127_500.0
    assert row["order_class"] == "entry"
    assert row["status"] == "QUEUED"
    assert row["signal_timestamp"] == signal_ts
    assert row["created_at"]  # timestamp present
    # client_order_id is the full sha256 (64 chars)
    assert len(row["client_order_id"]) == 64


# ── test_idempotency (EXE-06) ─────────────────────────────────────────────────

def test_idempotency():
    """EXE-06: Replaying same (user_id, robot_id, signal_ts) raises ValueError — no duplicate row."""
    call_count = {"n": 0}

    def _do_insert(row):
        call_count["n"] += 1
        if call_count["n"] > 1:
            raise Exception("duplicate key value violates unique constraint (23505)")
        m = MagicMock()
        m.execute.return_value = MagicMock(data=[row], error=None)
        return m

    mock_db = MagicMock()
    mock_db.table.return_value.insert.side_effect = _do_insert

    writer = SupabaseWriter(mock_db)
    signal_ts = "2026-06-16T21:00:00+00:00"

    # First insert succeeds
    writer.persist_order(
        user_id="user-1",
        robot_id="robot-1",
        signal_timestamp=signal_ts,
        effective_contract="WINM26",
        side="buy",
        qty=1,
        fill_price=127_500.0,
        order_class="entry",
    )

    # Second insert with identical ids → should raise ValueError (idempotency)
    with pytest.raises(ValueError, match="Duplicate client_order_id"):
        writer.persist_order(
            user_id="user-1",
            robot_id="robot-1",
            signal_timestamp=signal_ts,  # same timestamp → same hash
            effective_contract="WINM26",
            side="buy",
            qty=1,
            fill_price=127_500.0,
            order_class="entry",
        )

    # Only one DB insert was attempted with duplicate
    assert call_count["n"] == 2


def test_client_order_id_deterministic():
    """Same inputs always produce same client_order_id (deterministic hash)."""
    id1 = make_client_order_id("user-A", "robot-B", "2026-06-16T21:00:00Z")
    id2 = make_client_order_id("user-A", "robot-B", "2026-06-16T21:00:00Z")
    assert id1 == id2
    assert len(id1) == 64  # sha256 hex


def test_metaapi_client_id_short():
    """MetaApi clientId must be ≤28 chars to fit combined 30-char limit."""
    full = make_client_order_id("user-A", "robot-B", "2026-06-16T21:00:00Z")
    short = make_metaapi_client_id(full)
    assert len(short) <= 28
    assert short == full[:28]


def test_different_timestamps_different_ids():
    """Different signal timestamps produce different client_order_ids."""
    id1 = make_client_order_id("user-A", "robot-B", "2026-06-16T21:00:00Z")
    id2 = make_client_order_id("user-A", "robot-B", "2026-06-16T21:00:01Z")
    assert id1 != id2
