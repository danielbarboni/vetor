"""
Vetor Trading Platform — FastAPI application entry point.

Registers:
- CORSMiddleware with an explicit allowlist (never wildcard)
- GET /health  (unauthenticated)
- Placeholder router stubs (filled by later plans)
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers.robots import router as robots_router
from routers.auth import router as auth_router
from routers.conta import router as conta_router

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


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health", tags=["ops"])
async def health() -> dict:
    """Unauthenticated health-check endpoint. Returns HTTP 200 when the app is up."""
    return {"status": "ok"}


# ── Router includes (filled by later plans) ────────────────────────────────────
# Each router is imported and included once its plan is complete.
# Commented-out stubs document the intended route surface.

app.include_router(robots_router, prefix="/robots", tags=["robots"])
app.include_router(auth_router, prefix="/account", tags=["auth"])
app.include_router(conta_router, prefix="/account", tags=["account"])

# from routers.execution import router as execution_router
# app.include_router(execution_router, prefix="/robots", tags=["execution"])

# from routers.sumario import router as sumario_router
# app.include_router(sumario_router, prefix="/robots", tags=["sumario"])

# from routers.backtests import router as backtests_router
# app.include_router(backtests_router, prefix="/backtests", tags=["backtests"])
