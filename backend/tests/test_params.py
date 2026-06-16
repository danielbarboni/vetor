"""
test_params.py — EDT-01..04 IT param schema validation tests.

Tests for IT [Tangram 3.0] parameter validation:
  - Valid full payload passes and notes params_saved_at
  - Missing required field when indicator enabled → ValidationError
  - Cross-field filter toggle violation → ValidationError
  - At least one indicator must be enabled
  - MACD filtro de valor toggle → requires valor_do_filtro
  - ADX Aumento/Diminuição toggle → requires tendencia_direction
  - OBV candles_mesmo_sentido must be positive
  - Pontos Pivot: no special required-field cross-deps (always present)
"""
import pytest
from pydantic import ValidationError

from strategies.it_params_schema import ITParams


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _base_medias() -> dict:
    return {
        "habilitado": True,
        "habilitar_inversao": False,
        "modo_operacao": "entradas_e_saidas",
        "forma_uso": "cruzamento_das_medias",
        "media_curta_tipo": "simples",
        "media_curta_valor_usado": "fechamento",
        "media_curta_periodos": 9,
        "media_curta_deslocamento": 0,
        "media_longa_tipo": "simples",
        "media_longa_valor_usado": "fechamento",
        "media_longa_periodos": 40,
        "media_longa_deslocamento": 0,
    }


def _base_it_params(**indicator_overrides) -> dict:
    """Build a minimal valid ITParams payload with only Médias Móveis enabled."""
    indicators = {
        "medias_moveis": _base_medias(),
        "cruzamento_3_medias": {"habilitado": False},
        "hilo_activator": {"habilitado": False},
        "macd": {"habilitado": False},
        "adx": {"habilitado": False},
        "estocastico": {"habilitado": False},
        "vwap": {"habilitado": False},
        "ifr": {"habilitado": False},
        "bollinger": {"habilitado": False},
        "stop_atr": {"habilitado": False},
        "sar_parabolico": {"habilitado": False},
        "obv": {"habilitado": False},
        "detector_top_fundos": {"habilitado": False},
        "pontos_pivot": {"habilitado": False},
    }
    indicators.update(indicator_overrides)
    return {
        "modo_operacao_global": "candle_fechado",
        "tipo_envio_ordem": "a_mercado",
        "entrada_por_indicadores": "todos",
        **indicators,
    }


# ─── Rule group 1: valid payload passes ───────────────────────────────────────

def test_valid_payload_passes():
    """A fully valid payload with one enabled indicator passes without error."""
    params = _base_it_params()
    it = ITParams(**params)
    assert it.medias_moveis.habilitado is True
    assert it.medias_moveis.media_curta_periodos == 9


# ─── Rule group 2: at least one indicator must be enabled ─────────────────────

def test_at_least_one_indicator_required():
    """ValidationError when no indicator is enabled (RISK-04)."""
    params = _base_it_params(medias_moveis={"habilitado": False})
    with pytest.raises(ValidationError) as exc_info:
        ITParams(**params)
    assert "pelo menos um indicador" in str(exc_info.value).lower()


# ─── Rule group 3: required fields when indicator is enabled ──────────────────

def test_medias_moveis_requires_periodos_when_enabled():
    """Médias Móveis enabled without media_curta_periodos → ValidationError."""
    cfg = _base_medias()
    del cfg["media_curta_periodos"]
    params = _base_it_params(medias_moveis=cfg)
    with pytest.raises(ValidationError):
        ITParams(**params)


def test_hilo_requires_periodos_when_enabled():
    """HiLo Activator enabled without numero_periodos → ValidationError."""
    params = _base_it_params(
        medias_moveis={"habilitado": False},
        hilo_activator={
            "habilitado": True,
            "habilitar_inversao": False,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "mudanca_no_sentido",
            # missing numero_periodos
        },
    )
    with pytest.raises(ValidationError):
        ITParams(**params)


def test_macd_requires_periodos_when_enabled():
    """MACD enabled without media_curta_periodos → ValidationError."""
    params = _base_it_params(
        medias_moveis={"habilitado": False},
        macd={
            "habilitado": True,
            "habilitar_inversao": False,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "cruzamento_macd_sinal",
            "valor_usado": "fechamento",
            "tipo_media": "exponencial",
            # missing media_curta_periodos, media_longa_periodos, linha_sinal_periodos
        },
    )
    with pytest.raises(ValidationError):
        ITParams(**params)


# ─── Rule group 4: MACD filter toggle cross-field ─────────────────────────────

def test_macd_filtro_valor_requires_valor_do_filtro():
    """MACD filtro_de_valor=True but valor_do_filtro absent → ValidationError."""
    params = _base_it_params(
        medias_moveis={"habilitado": False},
        macd={
            "habilitado": True,
            "habilitar_inversao": False,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "cruzamento_macd_sinal",
            "valor_usado": "fechamento",
            "tipo_media": "exponencial",
            "media_curta_periodos": 12,
            "media_longa_periodos": 26,
            "linha_sinal_periodos": 9,
            "filtro_de_valor": True,
            # missing valor_do_filtro
        },
    )
    with pytest.raises(ValidationError) as exc_info:
        ITParams(**params)
    assert "valor_do_filtro" in str(exc_info.value).lower()


def test_macd_filtro_valor_ok_when_provided():
    """MACD filtro_de_valor=True with valor_do_filtro provided → passes."""
    params = _base_it_params(
        medias_moveis={"habilitado": False},
        macd={
            "habilitado": True,
            "habilitar_inversao": False,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "cruzamento_macd_sinal",
            "valor_usado": "fechamento",
            "tipo_media": "exponencial",
            "media_curta_periodos": 12,
            "media_longa_periodos": 26,
            "linha_sinal_periodos": 9,
            "filtro_de_valor": True,
            "valor_do_filtro": 0.0,
        },
    )
    it = ITParams(**params)
    assert it.macd.filtro_de_valor is True


# ─── Rule group 5: ADX filter toggles cross-field ─────────────────────────────

def test_adx_aumento_diminuicao_requires_tendencia():
    """ADX filtro_aumento_diminuicao=True but tendencia_direction absent → ValidationError."""
    params = _base_it_params(
        medias_moveis={"habilitado": False},
        adx={
            "habilitado": True,
            "habilitar_inversao": False,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "cruzamento_di_mais_di_menos",
            "di_periodos": 14,
            "adx_suavizador": 14,
            "filtro_aumento_diminuicao": True,
            # missing tendencia_direction
        },
    )
    with pytest.raises(ValidationError) as exc_info:
        ITParams(**params)
    assert "tendencia_direction" in str(exc_info.value).lower()


def test_adx_min_filter_requires_value():
    """ADX filtro_valor_minimo=True but adx_valor_minimo absent → ValidationError."""
    params = _base_it_params(
        medias_moveis={"habilitado": False},
        adx={
            "habilitado": True,
            "habilitar_inversao": False,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "cruzamento_di_mais_di_menos",
            "di_periodos": 14,
            "adx_suavizador": 14,
            "filtro_valor_minimo": True,
            # missing adx_valor_minimo
        },
    )
    with pytest.raises(ValidationError) as exc_info:
        ITParams(**params)
    assert "adx_valor_minimo" in str(exc_info.value).lower()


# ─── Rule group 6: OBV candles_mesmo_sentido positive ────────────────────────

def test_obv_candles_mesmo_sentido_must_be_positive():
    """OBV candles_mesmo_sentido=0 → ValidationError (must be positive)."""
    params = _base_it_params(
        medias_moveis={"habilitado": False},
        obv={
            "habilitado": True,
            "habilitar_inversao": False,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "mudanca_no_sentido",
            "media_tipo": "simples",
            "media_periodos": 15,
            "desvio_multiplicador": 10.0,
            "candles_mesmo_sentido": 0,  # invalid — must be > 0
        },
    )
    with pytest.raises(ValidationError) as exc_info:
        ITParams(**params)
    assert "positivo" in str(exc_info.value).lower() or "candles_mesmo_sentido" in str(exc_info.value).lower()


def test_obv_valid_when_candles_positive():
    """OBV candles_mesmo_sentido=3 passes."""
    params = _base_it_params(
        medias_moveis={"habilitado": False},
        obv={
            "habilitado": True,
            "habilitar_inversao": False,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "mudanca_no_sentido",
            "media_tipo": "simples",
            "media_periodos": 15,
            "desvio_multiplicador": 10.0,
            "candles_mesmo_sentido": 3,
        },
    )
    it = ITParams(**params)
    assert it.obv.candles_mesmo_sentido == 3


# ─── Rule group 7: Cruzamento 3 Médias ───────────────────────────────────────

def test_cruzamento_3_medias_requires_all_periodos():
    """Cruzamento3Medias enabled without mc_periodos → ValidationError."""
    params = _base_it_params(
        medias_moveis={"habilitado": False},
        cruzamento_3_medias={
            "habilitado": True,
            "habilitar_inversao": False,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "cruzamento_das_medias",
            "alinhamento_total": False,
            "mc_tipo": "simples",
            "mc_valor_usado": "fechamento",
            # missing mc_periodos, mi_*, ml_*
        },
    )
    with pytest.raises(ValidationError):
        ITParams(**params)


# ─── Rule group 8: IFR valid ──────────────────────────────────────────────────

def test_ifr_valid():
    """IFR (RSI) with all required fields passes."""
    params = _base_it_params(
        medias_moveis={"habilitado": False},
        ifr={
            "habilitado": True,
            "habilitar_inversao": False,
            "modo_operacao": "entradas_e_saidas",
            "forma_uso": "cruzamento_ifr",
            "valor_usado": "fechamento",
            "numero_periodos": 14,
            "nivel_sobrevendido": 30,
            "nivel_sobrecomprado": 70,
        },
    )
    it = ITParams(**params)
    assert it.ifr.numero_periodos == 14


# ─── Rule group 9: Pontos Pivot ──────────────────────────────────────────────

def test_pontos_pivot_valid():
    """Pontos Pivot with all toggle fields passes."""
    params = _base_it_params(
        medias_moveis={"habilitado": False},
        pontos_pivot={
            "habilitado": True,
            "habilitar_inversao": False,
            "modo_operacao": "entradas_e_saidas",
            "dx_distancia_entrada": 100.0,
            "utilizar_suporte1": True,
            "utilizar_suporte2": False,
            "utilizar_resistencia1": True,
            "utilizar_resistencia2": False,
            "habilitar_contra_tendencia": False,
        },
    )
    it = ITParams(**params)
    assert it.pontos_pivot.dx_distancia_entrada == 100.0
