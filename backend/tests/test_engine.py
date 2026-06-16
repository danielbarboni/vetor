"""
test_engine.py — EXE-01 … EXE-06 engine + indicator tests.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict
from unittest.mock import AsyncMock, MagicMock

import pytest

from engine.fill_simulator import FillSimulator
from engine.robot_engine import RobotEngine
from engine.strategies.indicadores_tecnicos import (
    ALL_14_INDICATOR_FIELDS,
    IndicadoresTecnicos,
    _INDICATOR_REGISTRY,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_tick(bid: float = 127_050.0, ask: float = 127_055.0) -> Dict[str, Any]:
    return {
        "symbol": "WINM26",
        "bid": bid,
        "ask": ask,
        "time": datetime.now(timezone.utc).isoformat(),
        "equity": 10_000.0,
    }


def _it_params_with_one_indicator(indicator_field: str, extra_cfg: dict | None = None):
    """Return a minimal ITParams with exactly one indicator enabled."""
    from strategies.it_params_schema import ITParams

    cfg = {
        "habilitado": True,
        "modo_operacao": "entradas_e_saidas",
        **(extra_cfg or {}),
    }
    return ITParams(**{indicator_field: cfg})


def _make_robot(params_saved_at=True) -> Dict[str, Any]:
    return {
        "id": "robot-001",
        "user_id": "user-001",
        "mode": "simulado",
        "fill_policy": "pessimista",
        "asset": "WIN%",
        "status": "parado",
        "params_saved_at": "2026-06-16T10:00:00Z" if params_saved_at else None,
        "params": {
            "medias_moveis": {
                "habilitado": True,
                "modo_operacao": "entradas_e_saidas",
                "forma_uso": "cruzamento_das_medias",
                "media_curta_tipo": "simples",
                "media_curta_valor_usado": "fechamento",
                "media_curta_periodos": 9,
                "media_longa_tipo": "simples",
                "media_longa_valor_usado": "fechamento",
                "media_longa_periodos": 21,
            }
        },
    }


def _make_engine(mock_broker=None, mock_writer=None):
    """Build a RobotEngine with mocked dependencies."""
    broker = mock_broker or AsyncMock()
    broker.get_positions = AsyncMock(return_value=[])
    broker.get_orders = AsyncMock(return_value=[])
    broker.subscribe = AsyncMock(return_value=None)
    broker.cancel_order = AsyncMock(return_value=None)
    broker.close_position = AsyncMock(return_value=None)
    broker.place_order = AsyncMock(return_value={"orderId": "test-oid"})

    tick_router = MagicMock()
    tick_router.subscribe = MagicMock()
    tick_router.unsubscribe = MagicMock()

    writer = mock_writer or MagicMock()
    writer.persist_order = MagicMock(return_value={"client_order_id": "abc" * 21})
    writer.update_order_status = MagicMock()

    ws = MagicMock()

    return RobotEngine(broker=broker, tick_router=tick_router, writer=writer, ws_manager=ws)


# ── test_start_requires_params (EXE-01) ───────────────────────────────────────

@pytest.mark.asyncio
async def test_start_requires_params():
    """EXE-01: Robot cannot start without saved params → raises ValueError."""
    robot_no_params = _make_robot(params_saved_at=False)
    engine = _make_engine()

    from engine.strategies.indicadores_tecnicos import IndicadoresTecnicos
    from strategies.it_params_schema import ITParams

    params = ITParams(
        medias_moveis={
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "cruzamento_das_medias",
            "media_curta_tipo": "simples",
            "media_curta_valor_usado": "fechamento",
            "media_curta_periodos": 9,
            "media_longa_tipo": "simples",
            "media_longa_valor_usado": "fechamento",
            "media_longa_periodos": 21,
        }
    )
    strategy = IndicadoresTecnicos(params)

    with pytest.raises(ValueError, match="params"):
        await engine.start(robot=robot_no_params, strategy=strategy, effective_contract="WINM26")


@pytest.mark.asyncio
async def test_start_with_params_launches_task():
    """EXE-01: Robot with saved params starts successfully → asyncio task created."""
    robot = _make_robot(params_saved_at=True)
    engine = _make_engine()

    from engine.strategies.indicadores_tecnicos import IndicadoresTecnicos
    from strategies.it_params_schema import ITParams

    params = ITParams(
        medias_moveis={
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "cruzamento_das_medias",
            "media_curta_tipo": "simples",
            "media_curta_valor_usado": "fechamento",
            "media_curta_periodos": 9,
            "media_longa_tipo": "simples",
            "media_longa_valor_usado": "fechamento",
            "media_longa_periodos": 21,
        }
    )
    strategy = IndicadoresTecnicos(params)

    await engine.start(robot=robot, strategy=strategy, effective_contract="WINM26")
    assert engine.is_running("user-001", "robot-001")

    # Clean up
    await engine.stop("user-001", "robot-001")


# ── Fill policy ordering (EXE-03) ─────────────────────────────────────────────

def test_fill_policy_pessimista_buy():
    """Pessimista BUY fills at ask (worst)."""
    sim = FillSimulator("pessimista")
    tick = {"bid": 127_050.0, "ask": 127_055.0}
    assert sim.fill_price(tick, "buy") == 127_055.0


def test_fill_policy_pessimista_sell():
    """Pessimista SELL fills at bid (worst)."""
    sim = FillSimulator("pessimista")
    tick = {"bid": 127_050.0, "ask": 127_055.0}
    assert sim.fill_price(tick, "sell") == 127_050.0


def test_fill_policy_otimista_buy():
    """Otimista BUY fills at bid (best)."""
    sim = FillSimulator("otimista")
    tick = {"bid": 127_050.0, "ask": 127_055.0}
    assert sim.fill_price(tick, "buy") == 127_050.0


def test_fill_policy_otimista_sell():
    """Otimista SELL fills at ask (best)."""
    sim = FillSimulator("otimista")
    tick = {"bid": 127_050.0, "ask": 127_055.0}
    assert sim.fill_price(tick, "sell") == 127_055.0


def test_fill_policy_moderado():
    """Moderado fills at mid-price."""
    sim = FillSimulator("moderado")
    tick = {"bid": 127_050.0, "ask": 127_055.0}
    assert sim.fill_price(tick, "buy") == 127_052.5
    assert sim.fill_price(tick, "sell") == 127_052.5


def test_fill_pessimista_worse_than_otimista_buy():
    """Pessimista BUY price ≥ Otimista BUY price (worse fill for buyer)."""
    tick = {"bid": 100.0, "ask": 101.0}
    pess = FillSimulator("pessimista").fill_price(tick, "buy")
    opti = FillSimulator("otimista").fill_price(tick, "buy")
    assert pess > opti


def test_fill_pessimista_worse_than_otimista_sell():
    """Pessimista SELL price ≤ Otimista SELL price (worse fill for seller)."""
    tick = {"bid": 100.0, "ask": 101.0}
    pess = FillSimulator("pessimista").fill_price(tick, "sell")
    opti = FillSimulator("otimista").fill_price(tick, "sell")
    assert pess < opti


def test_invalid_fill_policy():
    """Unknown fill policy raises ValueError."""
    with pytest.raises(ValueError, match="Invalid fill policy"):
        FillSimulator("imaginario")  # type: ignore[arg-type]


# ── test_all_indicators (project constraint) ──────────────────────────────────

def test_all_indicators_registered():
    """All 14 indicator fields are registered in _INDICATOR_REGISTRY."""
    assert len(ALL_14_INDICATOR_FIELDS) == 14
    for field in ALL_14_INDICATOR_FIELDS:
        assert field in _INDICATOR_REGISTRY, f"Indicator '{field}' not in registry"


def _params_for(field: str) -> Any:
    """Build minimal ITParams with only the given indicator enabled."""
    from strategies.it_params_schema import ITParams

    configs: Dict[str, Dict[str, Any]] = {
        "medias_moveis": {
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "cruzamento_das_medias",
            "media_curta_tipo": "simples",
            "media_curta_valor_usado": "fechamento",
            "media_curta_periodos": 3,
            "media_longa_tipo": "simples",
            "media_longa_valor_usado": "fechamento",
            "media_longa_periodos": 5,
        },
        "cruzamento_3_medias": {
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "posicao_das_medias",
            "mc_tipo": "simples",
            "mc_valor_usado": "fechamento",
            "mc_periodos": 3,
            "mi_tipo": "simples",
            "mi_valor_usado": "fechamento",
            "mi_periodos": 5,
            "ml_tipo": "simples",
            "ml_valor_usado": "fechamento",
            "ml_periodos": 7,
        },
        "hilo_activator": {
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "sentido_da_escada",
            "numero_periodos": 3,
        },
        "macd": {
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "macd_acima_abaixo_zero",
            "valor_usado": "fechamento",
            "tipo_media": "exponencial",
            "media_curta_periodos": 3,
            "media_longa_periodos": 5,
            "linha_sinal_periodos": 2,
        },
        "adx": {
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "di_mais_acima_abaixo_di_menos",
            "di_periodos": 5,
            "adx_suavizador": 5,
        },
        "estocastico": {
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "niveis_sobrecompra_sobrevenda",
            "periodos_k": 5,
            "periodos_d": 3,
            "suavizacao": 3,
            "nivel_sobrevendido": 20.0,
            "nivel_sobrecomprado": 80.0,
        },
        "vwap": {
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "compra_acima_vende_abaixo",
        },
        "ifr": {
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "ifr_acima_abaixo_nivel",
            "valor_usado": "fechamento",
            "numero_periodos": 5,
            "nivel_sobrevendido": 30.0,
            "nivel_sobrecomprado": 70.0,
        },
        "bollinger": {
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "cruzamento",
            "valor_usado": "fechamento",
            "numero_periodos": 5,
            "multiplicador_desvio": 2.0,
        },
        "stop_atr": {
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "sentido_stop_atr",
            "media_tipo": "simples",
            "media_periodos": 5,
            "desvio_multiplicador": 2.0,
        },
        "sar_parabolico": {
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "sentido_dos_pontos",
            "fator_aceleracao_inicial": 0.02,
            "incremento_fator_aceleracao": 0.02,
            "fator_aceleracao_maximo": 0.20,
        },
        "obv": {
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "continuacao_obv",
            "media_tipo": "simples",
            "media_periodos": 3,
            "desvio_multiplicador": 1.0,
            "candles_mesmo_sentido": 2,
        },
        "detector_top_fundos": {
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "sentido_do_topos_fundos",
            "numero_periodos": 1,
        },
        "pontos_pivot": {
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "dx_distancia_entrada": 40.0,
            "utilizar_suporte1": True,
        },
    }
    return ITParams(**{field: configs[field]})


def _feed_ticks_to_get_signal(
    strategy: IndicadoresTecnicos,
    n: int = 200,
    field: str = "",
) -> bool:
    """Feed crafted ticks and return True if any signal is emitted."""
    import math
    from datetime import timedelta

    base = 127_000.0
    # Start with "yesterday" so PontosPivot can accumulate a prev-day candle
    t0 = datetime(2026, 6, 15, 10, 0, 0, tzinfo=timezone.utc)

    for i in range(n):
        # Use two calendar days: first 60 ticks = day 1, rest = day 2
        day_offset = timedelta(days=0) if i < 60 else timedelta(days=1)
        ts = (t0 + day_offset + timedelta(seconds=i)).isoformat()

        # Oscillating pattern + occasional spike to pierce Bollinger bands
        price = base + 50.0 * math.sin(i * 0.3)
        if field == "bollinger" and i > 10:
            # Spike above the band on even ticks to trigger preco_acima_abaixo_banda
            price = base + 500.0 if (i % 20 == 0) else base - 500.0

        # PontosPivot: after day1 pivot levels are built, approach within dx=40 of S1.
        # Day1 oscillation gives S1 ≈ base-80..base-50; price=base-80 stays within dx=40.
        if field == "pontos_pivot" and i >= 60:
            price = base - 80.0

        tick = {
            "bid": price - 2.5,
            "ask": price + 2.5,
            "time": ts,
            "equity": 10_000.0,
        }
        strategy.on_tick(tick)
        if strategy.evaluate() is not None:
            return True
    return False


def test_all_indicators_can_emit_signal():
    """
    Project constraint: ALL 14 indicators are registered and each can emit a signal
    under a crafted triggering condition.
    """
    from engine.strategies.indicadores_tecnicos import IndicadoresTecnicos

    failed = []
    for field in ALL_14_INDICATOR_FIELDS:
        params = _params_for(field)
        strategy = IndicadoresTecnicos(params)
        emitted = _feed_ticks_to_get_signal(strategy, field=field)
        if not emitted:
            failed.append(field)

    assert not failed, (
        f"The following indicators did not emit any signal after 100 ticks: {failed}"
    )


def test_reset_state_clears_indicator_memory():
    """RISK-02: reset_state() clears all indicator history."""
    from strategies.it_params_schema import ITParams
    from engine.strategies.indicadores_tecnicos import IndicadoresTecnicos

    params = ITParams(
        medias_moveis={
            "habilitado": True,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "cruzamento_das_medias",
            "media_curta_tipo": "simples",
            "media_curta_valor_usado": "fechamento",
            "media_curta_periodos": 3,
            "media_longa_tipo": "simples",
            "media_longa_valor_usado": "fechamento",
            "media_longa_periodos": 5,
        }
    )
    strategy = IndicadoresTecnicos(params)

    # Feed some ticks
    for i in range(20):
        strategy.on_tick(_make_tick(bid=127_000.0 + i, ask=127_005.0 + i))

    # Reset — state should be cleared
    strategy.reset_state()

    # After reset, evaluate() returns None (no history)
    assert strategy.evaluate() is None

    # Strategy indicator internals should be fresh
    mm = strategy._indicators["medias_moveis"]
    assert len(mm._prices_curta) == 0
