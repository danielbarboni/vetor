"""
SupabaseWriter — idempotent order persistence (EXE-05, EXE-06).

client_order_id = sha256(user_id + robot_id + signal_timestamp)
  - Full 64-char hash stored in DB orders.client_order_id (UNIQUE constraint).
  - Short derived id (first 28 hex chars) sent to MetaApi as clientId (≤30 chars limit).
    MetaApi constraint: comment + clientId combined ≤ 30 chars (see poc-findings.md).

State machine: QUEUED → SENDING → SENT → CONFIRMED → FILLED

Order events are appended to order_events table.
Equity snapshots are written to equity_snapshots per fill.

Raw ticks are NEVER persisted (Pitfall 1 / RISK-03).
"""
from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

logger = logging.getLogger(__name__)

# Allowed state transitions
_TRANSITIONS: Dict[str, List[str]] = {
    "QUEUED":     ["SENDING"],
    "SENDING":    ["SENT", "QUEUED"],   # QUEUED = retry fallback
    "SENT":       ["CONFIRMED", "QUEUED"],
    "CONFIRMED":  ["FILLED", "CANCELLED"],
    "FILLED":     [],
    "CANCELLED":  [],
}

OrderStatus = Literal["QUEUED", "SENDING", "SENT", "CONFIRMED", "FILLED", "CANCELLED"]


def make_client_order_id(user_id: str, robot_id: str, signal_timestamp: str) -> str:
    """
    Deterministic client_order_id for DB idempotency (EXE-06).

    Returns full 64-char sha256 hex string for storage in orders.client_order_id.
    """
    raw = f"{user_id}:{robot_id}:{signal_timestamp}"
    return hashlib.sha256(raw.encode()).hexdigest()


def make_metaapi_client_id(full_hash: str) -> str:
    """
    Derive a short MetaApi clientId from the full hash (≤28 chars, alphanumeric).

    MetaApi constraint: comment + clientId combined ≤ 30 chars.
    We use the first 28 hex chars to stay within the limit even with a 2-char comment.
    """
    return full_hash[:28]


class SupabaseWriter:
    """
    Persists orders, order_events, and equity_snapshots to Supabase.

    All writes are idempotent: the UNIQUE constraint on orders.client_order_id
    is the database-level backstop. Duplicate inserts with the same
    client_order_id will raise a DB conflict which is caught and logged.

    Args:
        supabase: Supabase client (from db.supabase_client or test mock).
    """

    def __init__(self, supabase: Any) -> None:
        self._db = supabase

    def persist_order(
        self,
        *,
        user_id: str,
        robot_id: str,
        signal_timestamp: str,
        effective_contract: str,
        side: Literal["buy", "sell"],
        qty: int,
        fill_price: float,
        order_class: Literal["entry", "exit"],
        broker_order_id: Optional[str] = None,
        status: OrderStatus = "QUEUED",
    ) -> Dict[str, Any]:
        """
        Insert a new order row. Returns the inserted row dict.

        Raises ValueError on duplicate client_order_id (idempotency guard at app layer).
        The DB UNIQUE constraint is the authoritative backstop.
        """
        full_hash = make_client_order_id(user_id, robot_id, signal_timestamp)

        row = {
            "user_id":            user_id,
            "robot_id":           robot_id,
            "client_order_id":    full_hash,
            "broker_order_id":    broker_order_id,
            "effective_contract": effective_contract,
            "side":               side,
            "qty":                qty,
            "fill_price":         fill_price,
            "order_class":        order_class,
            "status":             status,
            "signal_timestamp":   signal_timestamp,
            "created_at":         datetime.now(timezone.utc).isoformat(),
        }

        try:
            result = (
                self._db.table("orders")
                .insert(row)
                .execute()
            )
            if result.data:
                logger.info(
                    "Order persisted: client_order_id=%s status=%s",
                    full_hash[:16] + "…",
                    status,
                )
                return result.data[0]
            else:
                # Supabase mock or empty response
                return row
        except Exception as exc:
            msg = str(exc)
            if "unique" in msg.lower() or "duplicate" in msg.lower() or "23505" in msg:
                logger.warning(
                    "Duplicate order rejected (idempotent): client_order_id=%s",
                    full_hash[:16] + "…",
                )
                raise ValueError(f"Duplicate client_order_id: {full_hash}") from exc
            raise

    def update_order_status(
        self,
        client_order_id: str,
        new_status: OrderStatus,
        broker_order_id: Optional[str] = None,
    ) -> None:
        """Advance the order state machine. Logs invalid transitions."""
        # Fetch current status
        result = (
            self._db.table("orders")
            .select("status")
            .eq("client_order_id", client_order_id)
            .execute()
        )
        rows = result.data if result.data else []
        if not rows:
            logger.warning("update_order_status: order not found %s", client_order_id[:16])
            return

        current = rows[0]["status"]
        allowed = _TRANSITIONS.get(current, [])
        if new_status not in allowed:
            logger.warning(
                "Invalid transition %s → %s for %s",
                current, new_status, client_order_id[:16],
            )
            return

        update: Dict[str, Any] = {
            "status": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if broker_order_id:
            update["broker_order_id"] = broker_order_id

        self._db.table("orders").update(update).eq(
            "client_order_id", client_order_id
        ).execute()
        logger.info("Order %s → %s", client_order_id[:16], new_status)

        # Append order event
        self._append_order_event(client_order_id, new_status)

    def _append_order_event(self, client_order_id: str, status: OrderStatus) -> None:
        event = {
            "client_order_id": client_order_id,
            "status":          status,
            "occurred_at":     datetime.now(timezone.utc).isoformat(),
        }
        try:
            self._db.table("order_events").insert(event).execute()
        except Exception as exc:
            logger.warning("Failed to append order event: %s", exc)

    def persist_equity_snapshot(
        self,
        *,
        user_id: str,
        robot_id: str,
        equity: float,
        balance: float,
        client_order_id: Optional[str] = None,
    ) -> None:
        """Write equity snapshot per fill (D-03)."""
        row = {
            "user_id":         user_id,
            "robot_id":        robot_id,
            "equity":          equity,
            "balance":         balance,
            "client_order_id": client_order_id,
            "snapshot_at":     datetime.now(timezone.utc).isoformat(),
        }
        try:
            self._db.table("equity_snapshots").insert(row).execute()
        except Exception as exc:
            logger.warning("Failed to persist equity snapshot: %s", exc)
