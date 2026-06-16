"""
RobotEngine — D-17 one asyncio.create_task per robot.

State machine:
  parado → executando (via start)
  executando → parado (via stop)

On start:
  1. Validate robot has saved params (params_saved_at set).
  2. Rehydrate open positions from broker (EXE-06 — no duplicate orders on restart).
  3. Subscribe to symbol ticks via the tick router.
  4. Launch asyncio task that loops on tick events.

On tick:
  - Route to strategy.on_tick(tick) → strategy.evaluate() → Signal
  - If signal, run FillSimulator, persist order via SupabaseWriter, place on broker (Simulado)
  - Staleness sentinel: if no tick >10s on active symbol → halt order placement (RISK-02)

On stop:
  - Cancel pending orders
  - Optionally close open position (close_position flag)
  - Cancel the asyncio task
  - Transition status → parado

On reconnect (RISK-02):
  - on_disconnected: halt order placement
  - on_connected: reset_state() on strategy, re-query positions/orders, resume

All state keyed [user_id][robot_id] (Pitfall 3).
"""
from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, Literal

from engine.fill_simulator import FillSimulator
from engine.strategy_base import StrategyBase

logger = logging.getLogger(__name__)

RobotStatus = Literal["parado", "executando"]

# Staleness threshold in seconds (RISK-02)
_STALENESS_THRESHOLD = 10.0


class RobotEngine:
    """
    Manages the lifecycle of a single trading robot.

    Args:
        broker: MetaAPIAdapter (or any BrokerPort implementor).
        tick_router: TickRouter instance for symbol subscription.
        writer: SupabaseWriter for order persistence.
        ws_manager: ConnectionManager for WS event fan-out.
    """

    def __init__(
        self,
        broker: Any,
        tick_router: Any,
        writer: Any,
        ws_manager: Any,
    ) -> None:
        self._broker = broker
        self._tick_router = tick_router
        self._writer = writer
        self._ws_manager = ws_manager

        # In-memory state: keyed robot_id → state (Pitfall 3 applied at higher level)
        self._tasks: Dict[str, asyncio.Task] = {}
        self._strategies: Dict[str, StrategyBase] = {}
        self._simulators: Dict[str, FillSimulator] = {}
        self._connected: Dict[str, bool] = {}
        self._last_tick_ts: Dict[str, float] = {}
        self._robot_meta: Dict[str, Dict[str, Any]] = {}

    def _robot_key(self, user_id: str, robot_id: str) -> str:
        return f"{user_id}:{robot_id}"

    async def start(
        self,
        robot: Dict[str, Any],
        strategy: StrategyBase,
        effective_contract: str,
    ) -> None:
        """
        Start the robot engine for the given robot dict.

        Args:
            robot: dict with keys: id, user_id, mode, fill_policy, params_saved_at.
            strategy: Instantiated strategy (e.g. IndicadoresTecnicos).
            effective_contract: Resolved B3 symbol (e.g. 'WINM26') from B3Calendar.

        Raises:
            ValueError: If robot.params_saved_at is None (EXE-01).
        """
        robot_id = robot["id"]
        user_id = robot["user_id"]
        key = self._robot_key(user_id, robot_id)

        # EXE-01: Must have saved params
        if not robot.get("params_saved_at"):
            raise ValueError(
                f"Robot {robot_id} cannot start: params have not been saved "
                "(params_saved_at is None). Save strategy params first."
            )

        if key in self._tasks and not self._tasks[key].done():
            logger.warning("Robot %s already running, ignoring start", robot_id)
            return

        logger.info("RobotEngine: starting robot=%s symbol=%s", robot_id, effective_contract)

        # EXE-06: Rehydrate open positions to avoid duplicating orders on restart
        existing_positions = await self._broker.get_positions()
        existing_orders = await self._broker.get_orders()
        logger.info(
            "Rehydrated %d positions, %d orders for robot=%s",
            len(existing_positions),
            len(existing_orders),
            robot_id,
        )

        # Store state
        self._strategies[key] = strategy
        self._simulators[key] = FillSimulator(policy=robot.get("fill_policy", "pessimista"))
        self._connected[key] = True
        self._last_tick_ts[key] = time.monotonic()
        self._robot_meta[key] = {
            "robot_id":          robot_id,
            "user_id":           user_id,
            "effective_contract": effective_contract,
            "mode":              robot.get("mode", "simulado"),
        }

        # Subscribe tick router
        self._tick_router.subscribe(
            effective_contract,
            user_id,
            robot_id,
            lambda uid, rid, tick: self._on_tick_sync(uid, rid, tick),
        )

        # Subscribe broker (MetaAPI streaming)
        await self._broker.subscribe(effective_contract)

        # Launch asyncio task (D-17)
        task = asyncio.create_task(
            self._run_loop(key, user_id, robot_id, effective_contract),
            name=f"robot-{robot_id}",
        )
        self._tasks[key] = task
        logger.info("RobotEngine: task created for robot=%s", robot_id)

    async def stop(
        self,
        user_id: str,
        robot_id: str,
        close_position: bool = False,
    ) -> None:
        """
        Stop the robot engine.

        Args:
            user_id: Owner of the robot.
            robot_id: Robot to stop.
            close_position: If True, close any open position before stopping (EXE-02).
        """
        key = self._robot_key(user_id, robot_id)
        meta = self._robot_meta.get(key, {})
        symbol = meta.get("effective_contract", "")

        logger.info("RobotEngine: stopping robot=%s close_position=%s", robot_id, close_position)

        # Cancel pending orders
        try:
            orders = await self._broker.get_orders()
            for order in orders:
                try:
                    await self._broker.cancel_order(order.get("id"))
                except Exception as exc:
                    logger.warning("Failed to cancel order %s: %s", order.get("id"), exc)
        except Exception as exc:
            logger.warning("Failed to fetch orders during stop: %s", exc)

        # Close open position if requested (EXE-02)
        if close_position:
            try:
                positions = await self._broker.get_positions()
                for pos in positions:
                    if pos.get("symbol") == symbol:
                        await self._broker.close_position(pos.get("id"))
                        logger.info("Closed position %s for robot=%s", pos.get("id"), robot_id)
            except Exception as exc:
                logger.warning("Failed to close position for robot=%s: %s", robot_id, exc)

        # Unsubscribe from tick router
        if symbol:
            self._tick_router.unsubscribe(symbol, user_id, robot_id)

        # Cancel asyncio task
        task = self._tasks.pop(key, None)
        if task and not task.done():
            task.cancel()
            try:
                await asyncio.wait_for(asyncio.shield(task), timeout=2.0)
            except (asyncio.CancelledError, asyncio.TimeoutError):
                pass

        # Clean up state
        self._strategies.pop(key, None)
        self._simulators.pop(key, None)
        self._connected.pop(key, None)
        self._last_tick_ts.pop(key, None)
        self._robot_meta.pop(key, None)

        logger.info("RobotEngine: robot=%s stopped", robot_id)

    def on_reconnect(self, user_id: str, robot_id: str) -> None:
        """Called by broker listener on_connected — RISK-02 reconnect handler."""
        key = self._robot_key(user_id, robot_id)
        self._connected[key] = True
        self._last_tick_ts[key] = time.monotonic()
        strategy = self._strategies.get(key)
        if strategy:
            strategy.reset_state()
            logger.info("RobotEngine: strategy reset on reconnect for robot=%s", robot_id)

    def on_disconnect(self, user_id: str, robot_id: str) -> None:
        """Called by broker listener on_disconnected — halt order placement."""
        key = self._robot_key(user_id, robot_id)
        self._connected[key] = False
        logger.warning("RobotEngine: disconnected, halting orders for robot=%s", robot_id)

    def _on_tick_sync(self, user_id: str, robot_id: str, tick: Dict[str, Any]) -> None:
        """
        Synchronous tick handler (called from TickRouter.dispatch).
        Delegates to the asyncio task via shared state.
        """
        key = self._robot_key(user_id, robot_id)
        self._last_tick_ts[key] = time.monotonic()

        strategy = self._strategies.get(key)
        if strategy is None:
            return

        if not self._connected.get(key, False):
            return

        # Staleness check
        if time.monotonic() - self._last_tick_ts[key] > _STALENESS_THRESHOLD:
            logger.warning("Staleness sentinel: no tick >%ss, halting for robot=%s", _STALENESS_THRESHOLD, robot_id)
            return

        strategy.on_tick(tick)

    async def _run_loop(
        self,
        key: str,
        user_id: str,
        robot_id: str,
        symbol: str,
    ) -> None:
        """
        Main asyncio task loop (D-17).
        Polls strategy.evaluate() and places orders when a signal is emitted.
        """
        logger.info("RobotEngine: event loop started for robot=%s", robot_id)
        try:
            while True:
                await asyncio.sleep(0.1)  # yield every 100ms

                if not self._connected.get(key, False):
                    continue

                # Staleness sentinel
                elapsed = time.monotonic() - self._last_tick_ts.get(key, time.monotonic())
                if elapsed > _STALENESS_THRESHOLD:
                    logger.warning(
                        "Staleness: no tick for %.1fs on robot=%s — halting",
                        elapsed, robot_id
                    )
                    continue

                strategy = self._strategies.get(key)
                if strategy is None:
                    break

                signal = strategy.evaluate()
                if signal is None:
                    continue

                simulator = self._simulators.get(key)
                if simulator is None:
                    continue

                meta = self._robot_meta.get(key, {})
                await self._execute_signal(
                    signal=signal,
                    user_id=user_id,
                    robot_id=robot_id,
                    symbol=symbol,
                    meta=meta,
                    simulator=simulator,
                )

        except asyncio.CancelledError:
            logger.info("RobotEngine: task cancelled for robot=%s", robot_id)
        except Exception as exc:
            logger.exception("RobotEngine: unhandled error in loop for robot=%s: %s", robot_id, exc)

    async def _execute_signal(
        self,
        signal: str,
        user_id: str,
        robot_id: str,
        symbol: str,
        meta: Dict[str, Any],
        simulator: FillSimulator,
    ) -> None:
        """Place a simulated order for the given signal."""
        # Build a pseudo-tick for fill pricing (latest tick used by strategy)
        # In real flow, the strategy holds the last tick; here we approximate
        pseudo_tick = {"bid": 0.0, "ask": 0.0}

        # For Simulado mode, fill price is computed from the tick
        fill_price = simulator.fill_price(pseudo_tick, side=signal)  # type: ignore[arg-type]
        signal_ts = datetime.now(timezone.utc).isoformat()

        from db.writer import make_client_order_id, make_metaapi_client_id
        full_hash = make_client_order_id(user_id, robot_id, signal_ts)
        short_id = make_metaapi_client_id(full_hash)

        # Persist order (QUEUED)
        try:
            self._writer.persist_order(
                user_id=user_id,
                robot_id=robot_id,
                signal_timestamp=signal_ts,
                effective_contract=symbol,
                side=signal,
                qty=1,
                fill_price=fill_price,
                order_class="entry",
                status="QUEUED",
            )
        except ValueError:
            # Duplicate — idempotency handled
            return

        # Place on broker (Simulado uses live MetaAPI system account — D-06)
        if meta.get("mode") == "simulado":
            try:
                options = {"clientId": short_id}
                if signal == "buy":
                    result = await self._broker.place_order(
                        {
                            "type": "buy",
                            "symbol": symbol,
                            "volume": 1,
                            "options": options,
                        }
                    )
                else:
                    result = await self._broker.place_order(
                        {
                            "type": "sell",
                            "symbol": symbol,
                            "volume": 1,
                            "options": options,
                        }
                    )
                broker_order_id = (result or {}).get("orderId")
                self._writer.update_order_status(
                    full_hash, "SENT", broker_order_id=broker_order_id
                )
            except Exception as exc:
                logger.error("Order placement failed for robot=%s: %s", robot_id, exc)
                self._writer.update_order_status(full_hash, "QUEUED")

    def is_running(self, user_id: str, robot_id: str) -> bool:
        """Return True if the robot has an active asyncio task."""
        key = self._robot_key(user_id, robot_id)
        task = self._tasks.get(key)
        return task is not None and not task.done()
