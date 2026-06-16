"""
Pydantic v2 base models matching the Vetor platform schema.

These mirror the column types and enums from RESEARCH.md Data Model.
Routers use *Out models for responses and *Create models for request bodies.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Enums ────────────────────────────────────────────────────────────────────

class RobotMode(str, Enum):
    simulado = "simulado"
    real = "real"


class RobotStatus(str, Enum):
    parado = "parado"
    executando = "executando"
    arquivado = "arquivado"


class AssetSymbol(str, Enum):
    win = "WIN%"
    wdo = "WDO%"
    bit = "BIT%"


class OrderType(str, Enum):
    buy = "buy"
    sell = "sell"


class OrderStatus(str, Enum):
    pending = "pending"
    filled = "filled"
    cancelled = "cancelled"
    rejected = "rejected"


class OrderClass(str, Enum):
    entry = "entry"
    exit = "exit"
    stop = "stop"


class BacktestStatus(str, Enum):
    aguardando = "aguardando"
    processando = "processando"
    concluido = "concluido"
    erro = "erro"


class FillPolicy(str, Enum):
    pessimista = "pessimista"
    moderado = "moderado"
    otimista = "otimista"


class BrokerName(str, Enum):
    btg = "btg"
    metaapi = "metaapi"


# ── Robot ─────────────────────────────────────────────────────────────────────

class RobotCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    strategy: str = Field(default="indicadores_tecnicos")
    mode: RobotMode
    asset: AssetSymbol
    capital: Optional[float] = Field(default=None, ge=0)


class RobotOut(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    strategy: str
    mode: RobotMode
    status: RobotStatus
    asset: AssetSymbol
    capital: Optional[float] = None
    params: Optional[Dict[str, Any]] = None
    effective_contract: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Orders ────────────────────────────────────────────────────────────────────

class OrderOut(BaseModel):
    id: UUID
    robot_id: UUID
    user_id: UUID
    client_order_id: str
    type: OrderType
    status: OrderStatus
    order_class: OrderClass
    asset: str
    contract: str
    quantity: int
    price: Optional[float] = None
    filled_price: Optional[float] = None
    created_at: datetime
    filled_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Backtests ─────────────────────────────────────────────────────────────────

class BacktestCreate(BaseModel):
    robot_id: UUID
    capital: float = Field(..., ge=0)
    fill_policy: FillPolicy = FillPolicy.pessimista
    date_from: datetime
    date_to: datetime
    include_costs: bool = True


class BacktestOut(BaseModel):
    id: UUID
    robot_id: UUID
    user_id: UUID
    status: BacktestStatus
    capital: float
    fill_policy: FillPolicy
    date_from: datetime
    date_to: datetime
    include_costs: bool
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Profile / Account ─────────────────────────────────────────────────────────

class ProfileOut(BaseModel):
    id: UUID
    user_id: UUID
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PreferencesOut(BaseModel):
    id: UUID
    user_id: UUID
    notifications_enabled: bool = True
    display_currency: str = "BRL"
    theme: str = "dark"
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Broker connections ─────────────────────────────────────────────────────────

class BrokerConnectionOut(BaseModel):
    id: UUID
    user_id: UUID
    broker: BrokerName
    metaapi_account_id: Optional[str] = None
    status: str  # connected / disconnected / error
    connected_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
