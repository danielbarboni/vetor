"""
Vetor Trading Platform — FastAPI application entry point.

Registers:
- CORSMiddleware with an explicit allowlist (never wildcard)
- GET /health  (unauthenticated)
- WS  /ws/{user_id}  (JWT-validated tick + event stream, D-01/D-04)
- Routers: robots, auth, conta, execution
- Startup: rehydrate 'executando' robots; register APScheduler rollover job
- Shutdown: cancel all robot engine tasks
"""
from __future__ import annotations

import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers.robots import router as robots_router
from routers.auth import router as auth_router
from routers.conta import router as conta_router
from routers.execution import router as execution_router  # noqa: E402
from tick_ws.ws_manager import manager as ws_manager

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Vetor Trading Platform API",
    version="0.1.0",
    description="FastAPI backend for the Vetor algorithmic trading platform.",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allowlist only: Cloudflare Pages domain + local dev (localhost:5173).
# NEVER use wildcard origins — this is a financial platform with real money.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Startup / Shutdown ────────────────────────────────────────────────────────

@app.on_event("startup")
async def _startup() -> None:
    """
    On startup:
    1. Register the APScheduler rollover job for B3 contracts (EXE-04).
    2. Rehydrate any robots persisted as 'executando' (EXE-06).
    """
    logger.info("Vetor API starting up")

    # Register B3 rollover scheduler (EXE-04)
    try:
        from b3_calendar.b3_calendar import B3Calendar
        from db.supabase_client import supabase as _sb
        calendar = B3Calendar(_sb)
        calendar.start_scheduler()
        logger.info("B3 rollover APScheduler started")
    except Exception as exc:
        logger.warning("B3 scheduler startup failed (non-fatal in test): %s", exc)

    # Rehydrate executando robots (EXE-06)
    try:
        from routers.execution import rehydrate_running_robots
        await rehydrate_running_robots()
    except Exception as exc:
        logger.warning("Robot rehydration on startup failed (non-fatal in test): %s", exc)


@app.on_event("shutdown")
async def _shutdown() -> None:
    """Gracefully cancel all robot engine tasks on shutdown."""
    logger.info("Vetor API shutting down")
    try:
        from routers.execution import shutdown_all_robots
        await shutdown_all_robots()
    except Exception as exc:
        logger.warning("Robot shutdown error: %s", exc)


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health", tags=["ops"])
async def health() -> dict:
    """Unauthenticated health-check endpoint. Returns HTTP 200 when the app is up."""
    return {"status": "ok"}


# ── WebSocket: /ws/{user_id} (D-01 / D-04) ───────────────────────────────────

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str) -> None:
    """
    Tick + event WebSocket per user (D-01/D-04).

    Validates the JWT token passed as a query param (?token=<jwt>).
    Registers the connection with ConnectionManager.
    Messages are multiplexed by robot_id envelope.
    """
    # JWT validation
    token = websocket.query_params.get("token", "")
    if not _validate_ws_token(token, user_id):
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await ws_manager.connect(user_id, websocket)
    try:
        while True:
            # Keep connection alive; the server pushes messages (send_tick / send_event)
            await websocket.receive_text()
            # Client messages are ignored in this protocol (server-push only)
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id)
        logger.info("WS disconnected: user=%s", user_id)
    except Exception as exc:
        ws_manager.disconnect(user_id)
        logger.warning("WS error for user=%s: %s", user_id, exc)


def _validate_ws_token(token: str, claimed_user_id: str) -> bool:
    """
    Validate a JWT token for the WebSocket endpoint.
    Returns True if the token's sub matches claimed_user_id.
    """
    if not token:
        return False
    try:
        import os
        from jose import jwt
        secret = os.getenv("SUPABASE_JWT_SECRET", "")
        if not secret:
            # In dev/test without a secret set, allow connection
            logger.warning("SUPABASE_JWT_SECRET not set — WS auth bypassed")
            return True
        payload = jwt.decode(token, secret, algorithms=["HS256"], audience="authenticated")
        return payload.get("sub") == claimed_user_id
    except Exception as exc:
        logger.warning("WS JWT validation failed: %s", exc)
        return False


# ── Router includes ────────────────────────────────────────────────────────────

app.include_router(robots_router, prefix="/robots", tags=["robots"])
app.include_router(auth_router, prefix="/account", tags=["auth"])
app.include_router(conta_router, prefix="/account", tags=["account"])
app.include_router(execution_router, prefix="/robots", tags=["execution"])
