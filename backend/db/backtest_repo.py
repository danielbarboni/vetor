"""
backtest_repo.py — User-scoped data access for backtests, backtest_orders, and user_credits.

BCK-02: create_backtest checks and decrements credits atomically before queuing.
Raises InsufficientCreditsError if the user has no available credits.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional


class InsufficientCreditsError(Exception):
    """Raised when a user has no backtest credits available (BCK-02)."""
    pass


class BacktestRepo:
    """
    Data access layer for the backtests flow.

    All methods scope queries to user_id for security.
    The Supabase client is injected (no singleton import) to ease testing.
    """

    CREDITS_TABLE = "user_credits"
    BACKTESTS_TABLE = "backtests"
    BT_ORDERS_TABLE = "backtest_orders"

    def __init__(self, supabase_client: Any) -> None:
        self._sb = supabase_client

    # ── Credits ──────────────────────────────────────────────────────────────

    def get_credits(self, user_id: str) -> int:
        """Return the current credit balance for a user (BCK-02)."""
        res = (
            self._sb.table(self.CREDITS_TABLE)
            .select("credits")
            .eq("user_id", user_id)
            .execute()
        )
        rows = res.data or []
        if not rows:
            return 0
        return int(rows[0].get("credits", 0))

    def _consume_credit(self, user_id: str) -> None:
        """
        Check and decrement exactly one credit atomically (BCK-02).

        Raises InsufficientCreditsError if credits == 0 or row not found.
        """
        # Read current balance
        res = (
            self._sb.table(self.CREDITS_TABLE)
            .select("id, credits")
            .eq("user_id", user_id)
            .execute()
        )
        rows = res.data or []

        if not rows or int(rows[0].get("credits", 0)) <= 0:
            raise InsufficientCreditsError(
                f"User {user_id} has no backtest credits available (BCK-02)"
            )

        row_id = rows[0]["id"]
        current = int(rows[0]["credits"])

        # Decrement by one
        self._sb.table(self.CREDITS_TABLE).update(
            {"credits": current - 1}
        ).eq("id", row_id).execute()

    # ── Backtests ─────────────────────────────────────────────────────────────

    def create_backtest(
        self,
        user_id: str,
        robot_id: str,
        capital: float,
        fill_policy: str,
        date_from: datetime,
        date_to: datetime,
        include_costs: bool = True,
    ) -> Dict[str, Any]:
        """
        Create a new backtest record in 'aguardando' status (BCK-01/BCK-02).

        Steps:
          1. Check + consume one credit (raises InsufficientCreditsError at 0).
          2. Insert backtest row with status='aguardando'.
          3. Return the inserted row.
        """
        # BCK-02: consume credit first; raises if insufficient
        self._consume_credit(user_id)

        payload = {
            "user_id": user_id,
            "robot_id": robot_id,
            "status": "aguardando",
            "capital": capital,
            "fill_policy": fill_policy,
            "date_from": date_from.isoformat() if isinstance(date_from, datetime) else date_from,
            "date_to": date_to.isoformat() if isinstance(date_to, datetime) else date_to,
            "include_costs": include_costs,
        }

        res = self._sb.table(self.BACKTESTS_TABLE).insert(payload).execute()
        rows = res.data or []
        if not rows:
            raise RuntimeError("Backtest insert returned no data")
        return rows[0]

    def list_backtests(self, user_id: str) -> List[Dict[str, Any]]:
        """Return all backtest records for a user (BCK-03)."""
        res = (
            self._sb.table(self.BACKTESTS_TABLE)
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []

    def get_backtest(self, user_id: str, backtest_id: str) -> Optional[Dict[str, Any]]:
        """Return a single backtest with full result (BCK-04)."""
        res = (
            self._sb.table(self.BACKTESTS_TABLE)
            .select("*")
            .eq("user_id", user_id)
            .eq("id", backtest_id)
            .execute()
        )
        rows = res.data or []
        return rows[0] if rows else None

    def update_backtest_status(
        self,
        backtest_id: str,
        status: str,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
    ) -> None:
        """Update the status (and optionally result/error) of a backtest."""
        payload: Dict[str, Any] = {"status": status}
        if result is not None:
            payload["result"] = result
        if error is not None:
            payload["error"] = error
        if status in ("concluido", "erro"):
            payload["completed_at"] = datetime.utcnow().isoformat()

        self._sb.table(self.BACKTESTS_TABLE).update(payload).eq("id", backtest_id).execute()

    # ── Backtest Orders ───────────────────────────────────────────────────────

    def insert_backtest_orders(
        self, backtest_id: str, orders: List[Dict[str, Any]]
    ) -> None:
        """Persist a list of simulated orders from a completed backtest run."""
        if not orders:
            return
        rows = [{"backtest_id": backtest_id, **o} for o in orders]
        self._sb.table(self.BT_ORDERS_TABLE).insert(rows).execute()

    def get_backtest_orders(
        self, user_id: str, backtest_id: str
    ) -> List[Dict[str, Any]]:
        """Return all orders for a backtest (joined through backtest user_id check)."""
        # Verify ownership first
        bt = self.get_backtest(user_id, backtest_id)
        if bt is None:
            return []

        res = (
            self._sb.table(self.BT_ORDERS_TABLE)
            .select("*")
            .eq("backtest_id", backtest_id)
            .order("filled_at", desc=False)
            .execute()
        )
        return res.data or []
