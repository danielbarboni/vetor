"""
B3 contract calendar — EXE-04.

Resolves continuous contracts (WIN%, WDO%, BIT%) to the current front-month
expiry. Handles rollover detection and trading-hours validation.

All datetime comparisons use zoneinfo America/Sao_Paulo (Pitfall 6).
"""
from __future__ import annotations

import logging
from datetime import datetime, time as dt_time
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)

BRT = ZoneInfo("America/Sao_Paulo")

# B3 trading session for mini futures (WIN/WDO)
# Regular session: 09:00–17:50 BRT (18:00 on some days — using conservative 17:50)
TRADING_START = dt_time(9, 0)
TRADING_END = dt_time(17, 50)

# Force-close time on expiry day
EXPIRY_FORCE_CLOSE_TIME = dt_time(16, 50)

# B3 public holidays (Brazil national holidays — partial list for 2026)
# In production this should come from a seeded table; this covers the key dates.
B3_HOLIDAYS_2026 = {
    datetime(2026, 1, 1).date(),   # Confraternização Universal
    datetime(2026, 2, 16).date(),  # Carnaval segunda
    datetime(2026, 2, 17).date(),  # Carnaval terça
    datetime(2026, 4, 3).date(),   # Sexta-feira Santa
    datetime(2026, 4, 21).date(),  # Tiradentes
    datetime(2026, 5, 1).date(),   # Dia do Trabalho
    datetime(2026, 6, 4).date(),   # Corpus Christi
    datetime(2026, 9, 7).date(),   # Independência
    datetime(2026, 10, 12).date(), # Nossa Senhora Aparecida
    datetime(2026, 11, 2).date(),  # Finados
    datetime(2026, 11, 15).date(), # Proclamação da República
    datetime(2026, 12, 25).date(), # Natal
}


def _now_brt() -> datetime:
    """Return current time in America/Sao_Paulo."""
    return datetime.now(tz=BRT)


def is_trading_hours(at: datetime | None = None) -> bool:
    """
    Return True if the given datetime (or now) is within B3 trading hours.
    Uses America/Sao_Paulo (Pitfall 6).
    """
    if at is None:
        at = _now_brt()
    # Ensure tz-aware BRT
    if at.tzinfo is None:
        at = at.replace(tzinfo=BRT)
    else:
        at = at.astimezone(BRT)

    local_date = at.date()
    local_time = at.time()

    # Weekend
    if local_date.weekday() >= 5:
        return False
    # Holiday
    if local_date in B3_HOLIDAYS_2026:
        return False
    # Session window
    return TRADING_START <= local_time <= TRADING_END


def is_expiry_force_close_time(expiry_date: "date", at: datetime | None = None) -> bool:
    """
    Return True if we are past the 16:50 BRT force-close window on expiry day.
    """
    if at is None:
        at = _now_brt()
    at_brt = at.astimezone(BRT)
    return at_brt.date() == expiry_date and at_brt.time() >= EXPIRY_FORCE_CLOSE_TIME


# ── Contract resolution ────────────────────────────────────────────────────────

class B3Calendar:
    """
    Contract resolver that queries the b3_contracts table for front-month data.

    Accepts an optional supabase client; when None uses in-memory fallback
    (test / bootstrap mode).
    """

    def __init__(self, supabase_client: object | None = None) -> None:
        self._supa = supabase_client
        # In-memory override for tests: asset → symbol
        self._overrides: dict[str, str] = {}

    def set_override(self, asset: str, symbol: str) -> None:
        """Override contract resolution for testing."""
        self._overrides[asset] = symbol

    def clear_overrides(self) -> None:
        self._overrides.clear()

    def resolve_contract(self, asset: str) -> str:
        """
        Return the current front-month contract symbol for the given asset wildcard.

        asset: 'WIN%' | 'WDO%' | 'BIT%'
        Returns e.g. 'WINM26'

        Raises ValueError if no front-month contract found.
        """
        # Test overrides take priority
        if asset in self._overrides:
            return self._overrides[asset]

        if self._supa is not None:
            return self._resolve_from_db(asset)

        raise ValueError(
            f"No supabase client and no override set for '{asset}'. "
            "Call set_override() in tests or provide a supabase client."
        )

    def _resolve_from_db(self, asset: str) -> str:
        """Query b3_contracts for is_front_month=true."""
        resp = (
            self._supa.table("b3_contracts")
            .select("symbol, expiry_date, rollover_date")
            .eq("asset", asset)
            .eq("is_front_month", True)
            .limit(1)
            .execute()
        )
        rows = getattr(resp, "data", []) or []
        if not rows:
            raise ValueError(
                f"No front-month contract found in b3_contracts for asset='{asset}'. "
                "Run the seed migration and verify is_front_month=true is set."
            )
        return rows[0]["symbol"]

    def get_expiry_info(self, asset: str) -> dict:
        """Return {symbol, expiry_date, rollover_date} for the front-month contract."""
        if self._supa is None:
            sym = self.resolve_contract(asset)
            return {"symbol": sym, "expiry_date": None, "rollover_date": None}

        resp = (
            self._supa.table("b3_contracts")
            .select("symbol, expiry_date, rollover_date")
            .eq("asset", asset)
            .eq("is_front_month", True)
            .limit(1)
            .execute()
        )
        rows = getattr(resp, "data", []) or []
        if not rows:
            raise ValueError(f"No front-month contract for '{asset}'")
        return rows[0]

    def needs_rollover(self, asset: str, at: datetime | None = None) -> bool:
        """
        Return True if the rollover date has passed and the contract should change.
        """
        if self._supa is None:
            return False
        info = self.get_expiry_info(asset)
        if not info.get("rollover_date"):
            return False
        now = (at or _now_brt()).astimezone(BRT).date()
        from datetime import date
        rollover = info["rollover_date"]
        if isinstance(rollover, str):
            rollover = date.fromisoformat(rollover)
        return now >= rollover

    def update_front_month(self, asset: str) -> str | None:
        """
        APScheduler daily 07:00 BRT job: find the next contract and mark it front-month.
        Returns the new front-month symbol or None if no change needed.
        """
        if self._supa is None:
            logger.warning("No supabase client — skipping front-month update for %s", asset)
            return None

        # Get current front-month
        current_info = self.get_expiry_info(asset)
        current_sym = current_info["symbol"]

        # Query next contract (by expiry_date, not yet front-month)
        resp = (
            self._supa.table("b3_contracts")
            .select("id, symbol, expiry_date")
            .eq("asset", asset)
            .eq("is_front_month", False)
            .order("expiry_date")
            .limit(1)
            .execute()
        )
        rows = getattr(resp, "data", []) or []
        if not rows:
            logger.warning("No next contract found for %s", asset)
            return None

        next_row = rows[0]
        # Mark old as not front-month, new as front-month
        (
            self._supa.table("b3_contracts")
            .update({"is_front_month": False})
            .eq("symbol", current_sym)
            .execute()
        )
        (
            self._supa.table("b3_contracts")
            .update({"is_front_month": True})
            .eq("id", next_row["id"])
            .execute()
        )
        logger.info("Rollover %s → %s for %s", current_sym, next_row["symbol"], asset)
        return next_row["symbol"]


# ── Module-level singleton ─────────────────────────────────────────────────────
# Initialized with None; RobotEngine injects the supabase client at startup.

_calendar: B3Calendar | None = None


def get_calendar(supabase_client: object | None = None) -> B3Calendar:
    """Return the module-level B3Calendar instance (creates on first call)."""
    global _calendar
    if _calendar is None:
        _calendar = B3Calendar(supabase_client)
    return _calendar


def resolve_contract(asset: str, supabase_client: object | None = None) -> str:
    """Convenience wrapper: resolve continuous contract to front-month symbol."""
    return get_calendar(supabase_client).resolve_contract(asset)
