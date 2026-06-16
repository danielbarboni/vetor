"""
test_calendar.py — EXE-04: B3 continuous contract resolution + rollover.
"""
from __future__ import annotations

from datetime import datetime, date
from zoneinfo import ZoneInfo
from unittest.mock import MagicMock

import pytest

from b3_calendar.b3_calendar import B3Calendar, is_trading_hours, is_expiry_force_close_time

BRT = ZoneInfo("America/Sao_Paulo")


# ── test_contract_resolution ───────────────────────────────────────────────────

def test_contract_resolution():
    """EXE-04: WIN%/WDO%/BIT% resolve to the correct current expiry contract code."""
    cal = B3Calendar()
    cal.set_override("WIN%", "WINM26")
    cal.set_override("WDO%", "WDOM26")
    cal.set_override("BIT%", "BITM26")

    assert cal.resolve_contract("WIN%") == "WINM26"
    assert cal.resolve_contract("WDO%") == "WDOM26"
    assert cal.resolve_contract("BIT%") == "BITM26"


def test_contract_resolution_post_rollover():
    """EXE-04: After rollover date passes, override returns next contract."""
    cal = B3Calendar()
    cal.set_override("WIN%", "WINQ26")
    assert cal.resolve_contract("WIN%") == "WINQ26"


def test_contract_resolution_from_db():
    """EXE-04: Resolves front-month symbol from supabase b3_contracts table."""
    rows = [{"symbol": "WINM26", "expiry_date": "2026-06-17", "rollover_date": "2026-06-10"}]
    mock_supa = MagicMock()
    execute_mock = MagicMock()
    execute_mock.data = rows
    (mock_supa.table.return_value
     .select.return_value
     .eq.return_value
     .eq.return_value
     .limit.return_value
     .execute.return_value) = execute_mock

    cal = B3Calendar(supabase_client=mock_supa)
    symbol = cal.resolve_contract("WIN%")
    assert symbol == "WINM26"


def test_contract_resolution_no_front_month_raises():
    """EXE-04: Raises ValueError when b3_contracts has no front-month row."""
    mock_supa = MagicMock()
    execute_mock = MagicMock()
    execute_mock.data = []
    (mock_supa.table.return_value
     .select.return_value
     .eq.return_value
     .eq.return_value
     .limit.return_value
     .execute.return_value) = execute_mock

    cal = B3Calendar(supabase_client=mock_supa)
    with pytest.raises(ValueError, match="No front-month contract"):
        cal.resolve_contract("WIN%")


def test_resolve_without_client_or_override_raises():
    """Resolve with no client and no override raises ValueError."""
    cal = B3Calendar()
    with pytest.raises(ValueError, match="No supabase client"):
        cal.resolve_contract("WIN%")


# ── Trading hours ──────────────────────────────────────────────────────────────

def test_trading_hours_open():
    """is_trading_hours returns True during B3 session (10:00 BRT weekday)."""
    at = datetime(2026, 6, 15, 10, 0, 0, tzinfo=BRT)  # Monday
    assert is_trading_hours(at) is True


def test_trading_hours_before_open():
    """is_trading_hours returns False before 09:00 BRT."""
    at = datetime(2026, 6, 15, 8, 59, 0, tzinfo=BRT)
    assert is_trading_hours(at) is False


def test_trading_hours_after_close():
    """is_trading_hours returns False after 17:50 BRT."""
    at = datetime(2026, 6, 15, 18, 0, 0, tzinfo=BRT)
    assert is_trading_hours(at) is False


def test_trading_hours_weekend():
    """is_trading_hours returns False on Saturday."""
    at = datetime(2026, 6, 13, 11, 0, 0, tzinfo=BRT)  # Saturday
    assert is_trading_hours(at) is False


def test_trading_hours_holiday():
    """is_trading_hours returns False on a B3 holiday."""
    at = datetime(2026, 1, 1, 10, 0, 0, tzinfo=BRT)
    assert is_trading_hours(at) is False


# ── Expiry force-close ────────────────────────────────────────────────────────

def test_expiry_force_close():
    """is_expiry_force_close_time returns True at 16:50 on expiry day."""
    expiry = date(2026, 6, 17)
    at = datetime(2026, 6, 17, 16, 50, 0, tzinfo=BRT)
    assert is_expiry_force_close_time(expiry, at) is True


def test_expiry_force_close_not_on_expiry_day():
    """Returns False when the current date is not the expiry day."""
    expiry = date(2026, 6, 17)
    at = datetime(2026, 6, 16, 17, 0, 0, tzinfo=BRT)
    assert is_expiry_force_close_time(expiry, at) is False


# ── needs_rollover ────────────────────────────────────────────────────────────

def test_needs_rollover_past_date():
    """needs_rollover returns True when rollover_date has passed."""
    mock_supa = MagicMock()
    execute_mock = MagicMock()
    execute_mock.data = [
        {"symbol": "WINM26", "expiry_date": "2026-06-17", "rollover_date": "2026-06-10"}
    ]
    (mock_supa.table.return_value
     .select.return_value
     .eq.return_value
     .eq.return_value
     .limit.return_value
     .execute.return_value) = execute_mock

    cal = B3Calendar(supabase_client=mock_supa)
    at = datetime(2026, 6, 16, 9, 0, 0, tzinfo=BRT)
    assert cal.needs_rollover("WIN%", at=at) is True


def test_needs_rollover_before_date():
    """needs_rollover returns False before rollover date."""
    mock_supa = MagicMock()
    execute_mock = MagicMock()
    execute_mock.data = [
        {"symbol": "WINQ26", "expiry_date": "2026-09-16", "rollover_date": "2026-09-09"}
    ]
    (mock_supa.table.return_value
     .select.return_value
     .eq.return_value
     .eq.return_value
     .limit.return_value
     .execute.return_value) = execute_mock

    cal = B3Calendar(supabase_client=mock_supa)
    at = datetime(2026, 6, 16, 9, 0, 0, tzinfo=BRT)
    assert cal.needs_rollover("WIN%", at=at) is False
