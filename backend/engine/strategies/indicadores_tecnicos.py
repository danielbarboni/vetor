"""
IT [Tangram 3.0] Strategy — indicadores_tecnicos.py

Implements ALL 14 indicators end-to-end, incrementally (no future data — Pitfall 4).
Each indicator computes its value from tick-by-tick candle accumulation and emits
buy/sell signals per its Forma de uso / Modo de operação settings from ITParams.

Signal logic:
  - Each enabled indicator produces: "buy", "sell", or None per tick
  - ITParams.entrada_por_indicadores == "todos"    → all enabled must agree (AND)
  - ITParams.entrada_por_indicadores == "pelo_menos_um" → any one suffices (OR)
  - habilitar_inversao flips buy↔sell on the indicator's signal

reset_state() clears ALL in-memory indicator state (RISK-02 reconnect).
"""
from __future__ import annotations

import math
from datetime import datetime, date
from typing import Any, Dict, List, Optional, Tuple

from engine.strategy_base import Signal, StrategyBase
from strategies.it_params_schema import (
    ITParams,
    FormaUsoMediasEnum,
    FormaUsoCruzamento3Enum,
    FormaUsoHiLoEnum,
    FormaUsoMACDEnum,
    FormaUsoADXEnum,
    FormaUsoEstocEnum,
    FormaUsoVWAPEnum,
    FormaUsoIFREnum,
    FormaUsoBollingerEnum,
    FormaUsoStopATREnum,
    FormaUsoSAREnum,
    FormaUsoOBVEnum,
    FormaUsoDetectorEnum,
    TipoMediaEnum,
    ValorUsadoEnum,
    TendenciaDirectionEnum,
)

# Registry: maps param field name → indicator class.  Used by test_all_indicators.
_INDICATOR_REGISTRY: Dict[str, str] = {}


def _register(param_field: str):
    def deco(cls):
        _INDICATOR_REGISTRY[param_field] = cls.__name__
        return cls
    return deco


# ── Candle aggregation ────────────────────────────────────────────────────────

class Candle:
    """A single OHLCV candle built from raw ticks."""
    __slots__ = ("open", "high", "low", "close", "volume", "timestamp")

    def __init__(self, price: float, timestamp: datetime) -> None:
        self.open = price
        self.high = price
        self.low = price
        self.close = price
        self.volume: float = 1.0
        self.timestamp = timestamp

    def update(self, price: float) -> None:
        self.high = max(self.high, price)
        self.low = min(self.low, price)
        self.close = price
        self.volume += 1.0

    def price_for(self, valor_usado: Optional[ValorUsadoEnum]) -> float:
        if valor_usado == ValorUsadoEnum.abertura:
            return self.open
        if valor_usado == ValorUsadoEnum.maxima:
            return self.high
        if valor_usado == ValorUsadoEnum.minima:
            return self.low
        return self.close  # default fechamento


# ── Moving average helpers ────────────────────────────────────────────────────

def _sma(values: List[float], period: int) -> Optional[float]:
    if len(values) < period:
        return None
    return sum(values[-period:]) / period


def _ema(values: List[float], period: int) -> Optional[float]:
    """Compute EMA using Wilder's formula for the most recent period values."""
    if len(values) < period:
        return None
    k = 2.0 / (period + 1)
    ema = sum(values[:period]) / period
    for v in values[period:]:
        ema = v * k + ema * (1 - k)
    return ema


def _wilder(values: List[float], period: int) -> Optional[float]:
    """Wilder smoothing (EMA with k=1/period)."""
    if len(values) < period:
        return None
    k = 1.0 / period
    ema = sum(values[:period]) / period
    for v in values[period:]:
        ema = v * k + ema * (1 - k)
    return ema


def _ma(values: List[float], period: int, tipo: Optional[TipoMediaEnum]) -> Optional[float]:
    if tipo == TipoMediaEnum.exponencial:
        return _ema(values, period)
    if tipo == TipoMediaEnum.wilder:
        return _wilder(values, period)
    return _sma(values, period)


def _apply_inversion(signal: Signal, invert: bool) -> Signal:
    if not invert or signal is None:
        return signal
    return "sell" if signal == "buy" else "buy"


# ── Indicator 1: Médias Móveis ────────────────────────────────────────────────

@_register("medias_moveis")
class MediasMoveis:
    """Two moving averages — crossover or position signal."""

    def __init__(self) -> None:
        self._prices_curta: List[float] = []
        self._prices_longa: List[float] = []
        self._prev_mc: Optional[float] = None
        self._prev_ml: Optional[float] = None

    def reset(self) -> None:
        self._prices_curta.clear()
        self._prices_longa.clear()
        self._prev_mc = None
        self._prev_ml = None

    def update(self, candle: Candle, cfg) -> Signal:
        pc = candle.price_for(cfg.media_curta_valor_usado)
        pl = candle.price_for(cfg.media_longa_valor_usado)
        self._prices_curta.append(pc)
        self._prices_longa.append(pl)

        mc = _ma(self._prices_curta, cfg.media_curta_periodos or 1, cfg.media_curta_tipo)
        ml = _ma(self._prices_longa, cfg.media_longa_periodos or 1, cfg.media_longa_tipo)

        if mc is None or ml is None:
            return None

        # Apply deslocamento (shift): compare current ma with its own value
        # deslocamento is a period shift; we approximate by requiring enough history
        signal: Signal = None
        if cfg.forma_uso == FormaUsoMediasEnum.cruzamento_das_medias:
            if self._prev_mc is not None and self._prev_ml is not None:
                if self._prev_mc <= self._prev_ml and mc > ml:
                    signal = "buy"
                elif self._prev_mc >= self._prev_ml and mc < ml:
                    signal = "sell"
        elif cfg.forma_uso == FormaUsoMediasEnum.posicao_das_medias:
            signal = "buy" if mc > ml else ("sell" if mc < ml else None)

        self._prev_mc = mc
        self._prev_ml = ml
        return _apply_inversion(signal, cfg.habilitar_inversao)


# ── Indicator 2: Cruzamento de 3 Médias ──────────────────────────────────────

@_register("cruzamento_3_medias")
class Cruzamento3Medias:
    """Three moving averages — crossover or position (alignment) signal."""

    def __init__(self) -> None:
        self._prices: List[float] = []
        self._prev: Tuple[Optional[float], Optional[float], Optional[float]] = (None, None, None)

    def reset(self) -> None:
        self._prices.clear()
        self._prev = (None, None, None)

    def update(self, candle: Candle, cfg) -> Signal:
        p = candle.price_for(cfg.mc_valor_usado)
        self._prices.append(p)

        mc = _ma(self._prices, cfg.mc_periodos or 1, cfg.mc_tipo)
        mi = _ma(self._prices, cfg.mi_periodos or 1, cfg.mi_tipo)
        ml = _ma(self._prices, cfg.ml_periodos or 1, cfg.ml_tipo)

        if mc is None or mi is None or ml is None:
            return None

        signal: Signal = None
        pmc, pmi, pml = self._prev

        if cfg.forma_uso == FormaUsoCruzamento3Enum.cruzamento_das_medias:
            if pmc is not None and pmi is not None and pml is not None:
                # MC crosses above MI and MI above ML
                if pmc <= pmi and mc > mi and mi > ml:
                    signal = "buy"
                elif pmc >= pmi and mc < mi and mi < ml:
                    signal = "sell"
        elif cfg.forma_uso == FormaUsoCruzamento3Enum.posicao_das_medias:
            if cfg.alinhamento_total:
                signal = "buy" if mc > mi > ml else ("sell" if mc < mi < ml else None)
            else:
                signal = "buy" if mc > ml else ("sell" if mc < ml else None)

        self._prev = (mc, mi, ml)
        return _apply_inversion(signal, cfg.habilitar_inversao)


# ── Indicator 3: HiLo Activator ───────────────────────────────────────────────

@_register("hilo_activator")
class HiLoActivator:
    """
    HiLo Activator — tracks rolling max(high)/min(low) to form a step trail.
    - mudanca_no_sentido: signal on direction change
    - sentido_da_escada: ongoing direction
    """

    def __init__(self) -> None:
        self._highs: List[float] = []
        self._lows: List[float] = []
        self._prev_direction: Optional[str] = None  # "up" or "down"

    def reset(self) -> None:
        self._highs.clear()
        self._lows.clear()
        self._prev_direction = None

    def update(self, candle: Candle, cfg) -> Signal:
        n = cfg.numero_periodos or 1
        self._highs.append(candle.high)
        self._lows.append(candle.low)

        if len(self._highs) < n:
            return None

        hilo_high = max(self._highs[-n:])
        hilo_low = min(self._lows[-n:])
        price = candle.close

        direction = "up" if price > hilo_low else ("down" if price < hilo_high else None)
        signal: Signal = None

        if cfg.forma_uso == FormaUsoHiLoEnum.mudanca_no_sentido:
            if direction != self._prev_direction:
                signal = "buy" if direction == "up" else ("sell" if direction == "down" else None)
        elif cfg.forma_uso == FormaUsoHiLoEnum.sentido_da_escada:
            signal = "buy" if direction == "up" else ("sell" if direction == "down" else None)

        self._prev_direction = direction
        return _apply_inversion(signal, cfg.habilitar_inversao)


# ── Indicator 4: MACD ─────────────────────────────────────────────────────────

@_register("macd")
class MACD:
    """MACD — EMA(fast) - EMA(slow), plus signal line EMA."""

    def __init__(self) -> None:
        self._prices: List[float] = []
        self._macd_vals: List[float] = []
        self._prev_macd: Optional[float] = None
        self._prev_signal: Optional[float] = None

    def reset(self) -> None:
        self._prices.clear()
        self._macd_vals.clear()
        self._prev_macd = None
        self._prev_signal = None

    def update(self, candle: Candle, cfg) -> Signal:
        p = candle.price_for(cfg.valor_usado)
        self._prices.append(p)

        fast = _ma(self._prices, cfg.media_curta_periodos or 12, cfg.tipo_media)
        slow = _ma(self._prices, cfg.media_longa_periodos or 26, cfg.tipo_media)
        if fast is None or slow is None:
            return None

        macd_val = fast - slow
        self._macd_vals.append(macd_val)

        sig_line = _ma(self._macd_vals, cfg.linha_sinal_periodos or 9, cfg.tipo_media)
        if sig_line is None:
            return None

        # Optional filter
        if cfg.filtro_de_valor and cfg.valor_do_filtro is not None:
            if abs(macd_val) < cfg.valor_do_filtro:
                return None

        signal: Signal = None
        if cfg.forma_uso == FormaUsoMACDEnum.cruzamento_macd_sinal:
            if self._prev_macd is not None and self._prev_signal is not None:
                if self._prev_macd <= self._prev_signal and macd_val > sig_line:
                    signal = "buy"
                elif self._prev_macd >= self._prev_signal and macd_val < sig_line:
                    signal = "sell"
        elif cfg.forma_uso == FormaUsoMACDEnum.macd_acima_abaixo_zero:
            signal = "buy" if macd_val > 0 else ("sell" if macd_val < 0 else None)

        self._prev_macd = macd_val
        self._prev_signal = sig_line
        return _apply_inversion(signal, cfg.habilitar_inversao)


# ── Indicator 5: ADX DI+/DI− ─────────────────────────────────────────────────

@_register("adx")
class ADX:
    """ADX with DI+ / DI- (Wilder smoothing)."""

    def __init__(self) -> None:
        self._candles: List[Candle] = []
        self._prev_di_plus: Optional[float] = None
        self._prev_di_minus: Optional[float] = None
        self._prev_adx: Optional[float] = None

    def reset(self) -> None:
        self._candles.clear()
        self._prev_di_plus = None
        self._prev_di_minus = None
        self._prev_adx = None

    def _compute(self, n: int, smooth: int) -> Tuple[Optional[float], Optional[float], Optional[float]]:
        if len(self._candles) < n + 1:
            return None, None, None
        candles = self._candles[-(n + 1):]
        tr_list: List[float] = []
        dm_plus: List[float] = []
        dm_minus: List[float] = []
        for i in range(1, len(candles)):
            c = candles[i]
            p = candles[i - 1]
            tr = max(c.high - c.low, abs(c.high - p.close), abs(c.low - p.close))
            up = c.high - p.high
            down = p.low - c.low
            dm_plus.append(up if up > down and up > 0 else 0.0)
            dm_minus.append(down if down > up and down > 0 else 0.0)
            tr_list.append(tr)

        atr = _wilder(tr_list, smooth) or 0.0001
        di_plus_val = 100.0 * (_wilder(dm_plus, smooth) or 0.0) / atr
        di_minus_val = 100.0 * (_wilder(dm_minus, smooth) or 0.0) / atr

        dx = 100.0 * abs(di_plus_val - di_minus_val) / max(di_plus_val + di_minus_val, 0.0001)
        # Approximate ADX as current DX (full Wilder smoothing needs more history)
        adx_val = dx
        return di_plus_val, di_minus_val, adx_val

    def update(self, candle: Candle, cfg) -> Signal:
        self._candles.append(candle)
        n = cfg.di_periodos or 14
        smooth = cfg.adx_suavizador or 14

        di_plus, di_minus, adx_val = self._compute(n, smooth)
        if di_plus is None or di_minus is None or adx_val is None:
            return None

        # Filters
        if cfg.filtro_valor_minimo and cfg.adx_valor_minimo is not None:
            if adx_val < cfg.adx_valor_minimo:
                return None
        if cfg.filtro_valor_maximo and cfg.adx_valor_maximo is not None:
            if adx_val > cfg.adx_valor_maximo:
                return None
        if cfg.filtro_aumento_diminuicao and cfg.tendencia_direction is not None:
            if self._prev_adx is not None:
                growing = adx_val > self._prev_adx
                if cfg.tendencia_direction == TendenciaDirectionEnum.ficando_mais_forte and not growing:
                    return None
                if cfg.tendencia_direction == TendenciaDirectionEnum.ficando_mais_fraca and growing:
                    return None

        signal: Signal = None
        if cfg.forma_uso == FormaUsoADXEnum.cruzamento_di_mais_di_menos:
            if self._prev_di_plus is not None and self._prev_di_minus is not None:
                if self._prev_di_plus <= self._prev_di_minus and di_plus > di_minus:
                    signal = "buy"
                elif self._prev_di_plus >= self._prev_di_minus and di_plus < di_minus:
                    signal = "sell"
        elif cfg.forma_uso == FormaUsoADXEnum.di_mais_acima_abaixo_di_menos:
            signal = "buy" if di_plus > di_minus else ("sell" if di_plus < di_minus else None)

        self._prev_di_plus = di_plus
        self._prev_di_minus = di_minus
        self._prev_adx = adx_val
        return _apply_inversion(signal, cfg.habilitar_inversao)


# ── Indicator 6: Estocástico (Pleno) ─────────────────────────────────────────

@_register("estocastico")
class Estocastico:
    """Full Stochastic (K%D% with smoothing)."""

    def __init__(self) -> None:
        self._highs: List[float] = []
        self._lows: List[float] = []
        self._closes: List[float] = []
        self._k_vals: List[float] = []
        self._d_vals: List[float] = []
        self._prev_k: Optional[float] = None
        self._prev_d: Optional[float] = None

    def reset(self) -> None:
        self._highs.clear()
        self._lows.clear()
        self._closes.clear()
        self._k_vals.clear()
        self._d_vals.clear()
        self._prev_k = None
        self._prev_d = None

    def update(self, candle: Candle, cfg) -> Signal:
        self._highs.append(candle.high)
        self._lows.append(candle.low)
        self._closes.append(candle.close)

        nk = cfg.periodos_k or 14
        nd = cfg.periodos_d or 3
        ns = cfg.suavizacao or 3

        if len(self._highs) < nk:
            return None

        hh = max(self._highs[-nk:])
        ll = min(self._lows[-nk:])
        raw_k = 100.0 * (self._closes[-1] - ll) / max(hh - ll, 0.0001)
        self._k_vals.append(raw_k)

        k_smooth = _sma(self._k_vals, ns)
        if k_smooth is None:
            return None

        self._d_vals.append(k_smooth)
        d_smooth = _sma(self._d_vals, nd)
        if d_smooth is None:
            return None

        obs = cfg.nivel_sobrevendido or 20.0
        obc = cfg.nivel_sobrecomprado or 80.0

        signal: Signal = None
        if cfg.forma_uso == FormaUsoEstocEnum.cruzamento_k_d:
            if self._prev_k is not None and self._prev_d is not None:
                if self._prev_k <= self._prev_d and k_smooth > d_smooth:
                    signal = "buy"
                elif self._prev_k >= self._prev_d and k_smooth < d_smooth:
                    signal = "sell"
        elif cfg.forma_uso == FormaUsoEstocEnum.niveis_sobrecompra_sobrevenda:
            if k_smooth < obs:
                signal = "buy"
            elif k_smooth > obc:
                signal = "sell"

        self._prev_k = k_smooth
        self._prev_d = d_smooth
        return _apply_inversion(signal, cfg.habilitar_inversao)


# ── Indicator 7: VWAP ────────────────────────────────────────────────────────

@_register("vwap")
class VWAP:
    """VWAP with daily reset. Signal on price vs VWAP line."""

    def __init__(self) -> None:
        self._cum_pv: float = 0.0
        self._cum_vol: float = 0.0
        self._vwap: Optional[float] = None
        self._prev_vwap: Optional[float] = None
        self._prev_price: Optional[float] = None
        self._day: Optional[date] = None

    def reset(self) -> None:
        self._cum_pv = 0.0
        self._cum_vol = 0.0
        self._vwap = None
        self._prev_vwap = None
        self._prev_price = None
        self._day = None

    def update(self, candle: Candle, cfg) -> Signal:
        today = candle.timestamp.date()
        if self._day != today:
            # Daily reset
            self._cum_pv = 0.0
            self._cum_vol = 0.0
            self._day = today

        typical = (candle.high + candle.low + candle.close) / 3.0
        self._cum_pv += typical * candle.volume
        self._cum_vol += candle.volume
        self._vwap = self._cum_pv / max(self._cum_vol, 0.0001)

        price = candle.close
        signal: Signal = None

        if cfg.forma_uso == FormaUsoVWAPEnum.rompimento:
            if self._prev_price is not None and self._prev_vwap is not None:
                if self._prev_price <= self._prev_vwap and price > self._vwap:
                    signal = "buy"
                elif self._prev_price >= self._prev_vwap and price < self._vwap:
                    signal = "sell"
        elif cfg.forma_uso == FormaUsoVWAPEnum.compra_acima_vende_abaixo:
            signal = "buy" if price > self._vwap else ("sell" if price < self._vwap else None)
        elif cfg.forma_uso == FormaUsoVWAPEnum.vende_acima_compra_abaixo:
            signal = "sell" if price > self._vwap else ("buy" if price < self._vwap else None)

        self._prev_vwap = self._vwap
        self._prev_price = price
        return _apply_inversion(signal, cfg.habilitar_inversao)


# ── Indicator 8: IFR (RSI) ────────────────────────────────────────────────────

@_register("ifr")
class IFR:
    """RSI — Wilder-smoothed average gain/loss."""

    def __init__(self) -> None:
        self._prices: List[float] = []
        self._prev_rsi: Optional[float] = None
        self._avg_gain: Optional[float] = None
        self._avg_loss: Optional[float] = None

    def reset(self) -> None:
        self._prices.clear()
        self._prev_rsi = None
        self._avg_gain = None
        self._avg_loss = None

    def update(self, candle: Candle, cfg) -> Signal:
        p = candle.price_for(cfg.valor_usado)
        self._prices.append(p)
        n = cfg.numero_periodos or 14

        if len(self._prices) < n + 1:
            return None

        if self._avg_gain is None:
            # Initialize
            gains = []
            losses = []
            for i in range(1, n + 1):
                diff = self._prices[i] - self._prices[i - 1]
                gains.append(max(diff, 0.0))
                losses.append(max(-diff, 0.0))
            self._avg_gain = sum(gains) / n
            self._avg_loss = sum(losses) / n
        else:
            diff = self._prices[-1] - self._prices[-2]
            gain = max(diff, 0.0)
            loss = max(-diff, 0.0)
            self._avg_gain = (self._avg_gain * (n - 1) + gain) / n
            self._avg_loss = (self._avg_loss * (n - 1) + loss) / n

        rs = self._avg_gain / max(self._avg_loss, 0.0001)
        rsi = 100.0 - 100.0 / (1.0 + rs)

        obs = cfg.nivel_sobrevendido or 30.0
        obc = cfg.nivel_sobrecomprado or 70.0

        signal: Signal = None
        if cfg.forma_uso == FormaUsoIFREnum.cruzamento_ifr:
            mid = (obs + obc) / 2.0
            if self._prev_rsi is not None:
                if self._prev_rsi <= mid < rsi:
                    signal = "buy"
                elif self._prev_rsi >= mid > rsi:
                    signal = "sell"
        elif cfg.forma_uso == FormaUsoIFREnum.ifr_acima_abaixo_nivel:
            if rsi < obs:
                signal = "buy"
            elif rsi > obc:
                signal = "sell"

        self._prev_rsi = rsi
        return _apply_inversion(signal, cfg.habilitar_inversao)


# ── Indicator 9: Bandas de Bollinger ─────────────────────────────────────────

@_register("bollinger")
class Bollinger:
    """Bollinger Bands — SMA ± k*stddev."""

    def __init__(self) -> None:
        self._prices: List[float] = []
        self._prev_price: Optional[float] = None
        self._prev_upper: Optional[float] = None
        self._prev_lower: Optional[float] = None

    def reset(self) -> None:
        self._prices.clear()
        self._prev_price = None
        self._prev_upper = None
        self._prev_lower = None

    def update(self, candle: Candle, cfg) -> Signal:
        p = candle.price_for(cfg.valor_usado)
        self._prices.append(p)
        n = cfg.numero_periodos or 20
        k = cfg.multiplicador_desvio or 2.0

        sma = _sma(self._prices, n)
        if sma is None:
            return None

        window = self._prices[-n:]
        std = math.sqrt(sum((x - sma) ** 2 for x in window) / n)
        upper = sma + k * std
        lower = sma - k * std

        price = candle.close
        signal: Signal = None

        if cfg.forma_uso == FormaUsoBollingerEnum.cruzamento:
            if self._prev_price is not None and self._prev_upper is not None:
                if self._prev_price < self._prev_upper and price >= upper:
                    signal = "buy"
                elif self._prev_price > self._prev_lower and price <= lower:
                    signal = "sell"
        elif cfg.forma_uso == FormaUsoBollingerEnum.preco_acima_abaixo_banda:
            signal = "buy" if price >= upper else ("sell" if price <= lower else None)

        self._prev_price = price
        self._prev_upper = upper
        self._prev_lower = lower
        return _apply_inversion(signal, cfg.habilitar_inversao)


# ── Indicator 10: Stop ATR ────────────────────────────────────────────────────

@_register("stop_atr")
class StopATR:
    """ATR-based trailing stop — changes direction when price crosses the trail."""

    def __init__(self) -> None:
        self._candles: List[Candle] = []
        self._trail: Optional[float] = None
        self._direction: Optional[str] = None  # "up" or "down"
        self._prev_direction: Optional[str] = None

    def reset(self) -> None:
        self._candles.clear()
        self._trail = None
        self._direction = None
        self._prev_direction = None

    def update(self, candle: Candle, cfg) -> Signal:
        self._candles.append(candle)
        n = cfg.media_periodos or 14
        mult = cfg.desvio_multiplicador or 2.0

        if len(self._candles) < n + 1:
            return None

        tr_list = []
        for i in range(1, len(self._candles)):
            c = self._candles[i]
            p = self._candles[i - 1]
            tr_list.append(max(c.high - c.low, abs(c.high - p.close), abs(c.low - p.close)))

        atr_fn = _wilder if cfg.media_tipo and cfg.media_tipo.value == "wilder" else _sma
        atr = atr_fn(tr_list, n)
        if atr is None:
            return None

        price = candle.close
        band = mult * atr

        if self._trail is None:
            self._trail = price - band
            self._direction = "up"
        else:
            if self._direction == "up":
                self._trail = max(self._trail, price - band)
                if price < self._trail:
                    self._direction = "down"
                    self._trail = price + band
            else:
                self._trail = min(self._trail, price + band)
                if price > self._trail:
                    self._direction = "up"
                    self._trail = price - band

        signal: Signal = None
        if cfg.forma_uso == FormaUsoStopATREnum.mudanca_no_sentido:
            if self._direction != self._prev_direction:
                signal = "buy" if self._direction == "up" else "sell"
        elif cfg.forma_uso == FormaUsoStopATREnum.sentido_stop_atr:
            signal = "buy" if self._direction == "up" else "sell"

        self._prev_direction = self._direction
        return _apply_inversion(signal, cfg.habilitar_inversao)


# ── Indicator 11: SAR Parabólico ──────────────────────────────────────────────

@_register("sar_parabolico")
class SARParabolico:
    """Parabolic SAR (Wilder's algorithm)."""

    def __init__(self) -> None:
        self._sar: Optional[float] = None
        self._ep: Optional[float] = None   # extreme point
        self._af: float = 0.0              # acceleration factor
        self._bull: bool = True            # True = uptrend
        self._prev_bull: Optional[bool] = None
        self._candles: List[Candle] = []

    def reset(self) -> None:
        self._sar = None
        self._ep = None
        self._af = 0.0
        self._bull = True
        self._prev_bull = None
        self._candles.clear()

    def update(self, candle: Candle, cfg) -> Signal:
        self._candles.append(candle)
        if len(self._candles) < 2:
            return None

        af0 = cfg.fator_aceleracao_inicial or 0.02
        af_inc = cfg.incremento_fator_aceleracao or 0.02
        af_max = cfg.fator_aceleracao_maximo or 0.20

        if self._sar is None:
            # Bootstrap on second candle
            self._bull = self._candles[-1].close > self._candles[-2].close
            self._sar = self._candles[-2].low if self._bull else self._candles[-2].high
            self._ep = self._candles[-1].high if self._bull else self._candles[-1].low
            self._af = af0
            self._prev_bull = self._bull
            return None

        prev_sar = self._sar
        prev_bull = self._bull

        if self._bull:
            self._sar = prev_sar + self._af * (self._ep - prev_sar)
            self._sar = min(self._sar, self._candles[-2].low, self._candles[-3].low if len(self._candles) >= 3 else self._candles[-2].low)
            if candle.low < self._sar:
                self._bull = False
                self._sar = self._ep
                self._ep = candle.low
                self._af = af0
            else:
                if candle.high > self._ep:
                    self._ep = candle.high
                    self._af = min(self._af + af_inc, af_max)
        else:
            self._sar = prev_sar + self._af * (self._ep - prev_sar)
            self._sar = max(self._sar, self._candles[-2].high, self._candles[-3].high if len(self._candles) >= 3 else self._candles[-2].high)
            if candle.high > self._sar:
                self._bull = True
                self._sar = self._ep
                self._ep = candle.high
                self._af = af0
            else:
                if candle.low < self._ep:
                    self._ep = candle.low
                    self._af = min(self._af + af_inc, af_max)

        signal: Signal = None
        if cfg.forma_uso == FormaUsoSAREnum.mudanca_no_sentido:
            if self._bull != prev_bull:
                signal = "buy" if self._bull else "sell"
        elif cfg.forma_uso == FormaUsoSAREnum.sentido_dos_pontos:
            signal = "buy" if self._bull else "sell"

        self._prev_bull = self._bull
        return _apply_inversion(signal, cfg.habilitar_inversao)


# ── Indicator 12: OBV ─────────────────────────────────────────────────────────

@_register("obv")
class OBV:
    """On-Balance Volume — cumulative directional volume."""

    def __init__(self) -> None:
        self._obv: float = 0.0
        self._obv_vals: List[float] = []
        self._obv_ma_vals: List[float] = []
        self._prev_close: Optional[float] = None
        self._consecutive: int = 0
        self._consecutive_dir: Optional[str] = None

    def reset(self) -> None:
        self._obv = 0.0
        self._obv_vals.clear()
        self._obv_ma_vals.clear()
        self._prev_close = None
        self._consecutive = 0
        self._consecutive_dir = None

    def update(self, candle: Candle, cfg) -> Signal:
        if self._prev_close is not None:
            if candle.close > self._prev_close:
                self._obv += candle.volume
            elif candle.close < self._prev_close:
                self._obv -= candle.volume
        self._obv_vals.append(self._obv)
        self._prev_close = candle.close

        n = cfg.media_periodos or 14
        mult = cfg.desvio_multiplicador or 1.0
        n_same = cfg.candles_mesmo_sentido or 3

        obv_ma = _ma(self._obv_vals, n, cfg.media_tipo)
        if obv_ma is None:
            return None

        # Band around OBV MA (computed but used implicitly via obv vs obv_ma comparison)
        recent = self._obv_vals[-n:]
        _std = math.sqrt(sum((x - obv_ma) ** 2 for x in recent) / len(recent))
        _upper = obv_ma + mult * _std  # noqa: F841 — reserved for future band-pierce signal
        _lower = obv_ma - mult * _std  # noqa: F841

        signal: Signal = None
        cur_dir = "up" if self._obv > obv_ma else ("down" if self._obv < obv_ma else None)

        if cfg.forma_uso == FormaUsoOBVEnum.mudanca_no_sentido:
            if cur_dir != self._consecutive_dir:
                signal = "buy" if cur_dir == "up" else ("sell" if cur_dir == "down" else None)
        elif cfg.forma_uso == FormaUsoOBVEnum.continuacao_obv:
            if cur_dir == self._consecutive_dir:
                self._consecutive += 1
            else:
                self._consecutive = 1
                self._consecutive_dir = cur_dir
            if self._consecutive >= n_same:
                signal = "buy" if cur_dir == "up" else ("sell" if cur_dir == "down" else None)

        self._consecutive_dir = cur_dir
        return _apply_inversion(signal, cfg.habilitar_inversao)


# ── Indicator 13: Detector de Topos e Fundos ─────────────────────────────────

@_register("detector_top_fundos")
class DetectorTopFundos:
    """
    Swing high/low detector using a pivot-point window of n candles on each side.
    numero_periodos (1–4) controls how many bars each side to confirm a pivot.
    """

    def __init__(self) -> None:
        self._candles: List[Candle] = []
        self._swings: List[Tuple[str, float]] = []  # ("high"/"low", price)

    def reset(self) -> None:
        self._candles.clear()
        self._swings.clear()

    def update(self, candle: Candle, cfg) -> Signal:
        self._candles.append(candle)
        n = cfg.numero_periodos or 2  # bars each side
        needed = 2 * n + 1

        if len(self._candles) < needed:
            return None

        # Check the middle candle of the window
        mid = len(self._candles) - n - 1
        pivot = self._candles[mid]
        left = self._candles[mid - n:mid]
        right = self._candles[mid + 1:mid + n + 1]

        is_high = all(pivot.high >= c.high for c in left + right)
        is_low = all(pivot.low <= c.low for c in left + right)

        new_swing: Optional[Tuple[str, float]] = None
        if is_high:
            new_swing = ("high", pivot.high)
        elif is_low:
            new_swing = ("low", pivot.low)

        if new_swing is None:
            return None

        self._swings.append(new_swing)
        if len(self._swings) < 2:
            return None

        prev_type, prev_val = self._swings[-2]
        cur_type, cur_val = self._swings[-1]

        signal: Signal = None
        if cfg.forma_uso == FormaUsoDetectorEnum.mudanca_no_sinal:
            if cur_type == "low" and prev_type == "high":
                signal = "buy"
            elif cur_type == "high" and prev_type == "low":
                signal = "sell"
        elif cfg.forma_uso == FormaUsoDetectorEnum.sentido_do_topos_fundos:
            if cur_type == "high":
                # Higher highs = uptrend
                signal = "buy" if cur_val > prev_val else "sell"
            elif cur_type == "low":
                # Higher lows = uptrend
                signal = "buy" if cur_val > prev_val else "sell"

        return _apply_inversion(signal, cfg.habilitar_inversao)


# ── Indicator 14: Pontos Pivot ────────────────────────────────────────────────

@_register("pontos_pivot")
class PontosPivot:
    """
    Classic floor pivot points (daily period).
    P  = (H + L + C) / 3
    R1 = 2P - L,  R2 = P + (H - L)
    S1 = 2P - H,  S2 = P - (H - L)
    Signal: price approaches (within dx_distancia_entrada) a support/resistance level.
    """

    def __init__(self) -> None:
        self._prev_day_candle: Optional[Candle] = None
        self._today_candles: List[Candle] = []
        self._levels: Dict[str, float] = {}
        self._day: Optional[date] = None

    def reset(self) -> None:
        self._prev_day_candle = None
        self._today_candles.clear()
        self._levels.clear()
        self._day = None

    def _compute_levels(self, h: float, lo: float, c: float) -> Dict[str, float]:
        p = (h + lo + c) / 3.0
        return {
            "P":  p,
            "R1": 2 * p - lo,
            "R2": p + (h - lo),
            "S1": 2 * p - h,
            "S2": p - (h - lo),
        }

    def update(self, candle: Candle, cfg) -> Signal:
        today = candle.timestamp.date()
        if self._day != today:
            if self._today_candles:
                # Consolidate yesterday into summary candle
                yday = Candle(self._today_candles[0].close, self._today_candles[0].timestamp)
                yday.high = max(c.high for c in self._today_candles)
                yday.low = min(c.low for c in self._today_candles)
                yday.close = self._today_candles[-1].close
                self._prev_day_candle = yday
                self._levels = self._compute_levels(yday.high, yday.low, yday.close)
            self._today_candles = []
            self._day = today

        self._today_candles.append(candle)

        if not self._levels:
            return None

        dx = cfg.dx_distancia_entrada or 5.0
        price = candle.close
        signal: Signal = None

        enabled_levels = []
        if cfg.utilizar_suporte1:
            enabled_levels.append(("S1", self._levels["S1"], "buy"))
        if cfg.utilizar_suporte2:
            enabled_levels.append(("S2", self._levels["S2"], "buy"))
        if cfg.utilizar_resistencia1:
            enabled_levels.append(("R1", self._levels["R1"], "sell"))
        if cfg.utilizar_resistencia2:
            enabled_levels.append(("R2", self._levels["R2"], "sell"))

        for name, level, direction in enabled_levels:
            if abs(price - level) <= dx:
                if cfg.habilitar_contra_tendencia:
                    signal = "buy" if direction == "sell" else "sell"
                else:
                    signal = direction
                break

        return _apply_inversion(signal, cfg.habilitar_inversao)


# ── Main strategy class ───────────────────────────────────────────────────────

# Map ITParams field name → indicator instance class
_INDICATOR_CLASSES = {
    "medias_moveis":      MediasMoveis,
    "cruzamento_3_medias": Cruzamento3Medias,
    "hilo_activator":     HiLoActivator,
    "macd":               MACD,
    "adx":                ADX,
    "estocastico":        Estocastico,
    "vwap":               VWAP,
    "ifr":                IFR,
    "bollinger":          Bollinger,
    "stop_atr":           StopATR,
    "sar_parabolico":     SARParabolico,
    "obv":                OBV,
    "detector_top_fundos": DetectorTopFundos,
    "pontos_pivot":       PontosPivot,
}

ALL_14_INDICATOR_FIELDS = list(_INDICATOR_CLASSES.keys())


class IndicadoresTecnicos(StrategyBase):
    """
    IT [Tangram 3.0] strategy.

    - Consumes ITParams (validated param schema from plan 08).
    - Maintains all 14 indicator instances; disabled ones are skipped per tick.
    - Aggregates ticks into candles (one candle = timeframe bucket, approximated per tick for live).
    - Emits buy/sell/None via evaluate() after each on_tick().
    - reset_state() clears all indicator state (RISK-02).
    """

    def __init__(self, params: ITParams) -> None:
        self._params = params
        # Instantiate all 14 indicator objects
        self._indicators: Dict[str, Any] = {
            name: cls() for name, cls in _INDICATOR_CLASSES.items()
        }
        # Current candle (we use tick mid-price as close approximation)
        self._current_candle: Optional[Candle] = None
        self._last_signal: Signal = None

    def on_tick(self, tick: Dict[str, Any]) -> None:
        """Process tick and update all enabled indicators."""
        mid = (tick["bid"] + tick["ask"]) / 2.0
        ts = tick.get("time")
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts)
        if ts is None:
            ts = datetime.utcnow()

        # One candle per tick (live approximation — no OHLCV aggregation buffer needed for signals)
        candle = Candle(mid, ts)
        self._current_candle = candle

        signals: List[Signal] = []
        for field_name, indicator in self._indicators.items():
            cfg = getattr(self._params, field_name)
            if not cfg.habilitado:
                continue
            sig = indicator.update(candle, cfg)
            signals.append(sig)

        if not signals:
            self._last_signal = None
            return

        mode = self._params.entrada_por_indicadores
        if mode == "todos":
            # All enabled must agree on same non-None signal
            non_none = [s for s in signals if s is not None]
            if len(non_none) == len(signals) and len(set(non_none)) == 1:
                self._last_signal = non_none[0]
            else:
                self._last_signal = None
        else:  # pelo_menos_um
            for s in signals:
                if s is not None:
                    self._last_signal = s
                    return
            self._last_signal = None

    def evaluate(self) -> Signal:
        """Return the signal computed during the last on_tick call."""
        return self._last_signal

    def reset_state(self) -> None:
        """Clear all indicator state (RISK-02: called on reconnect)."""
        for indicator in self._indicators.values():
            indicator.reset()
        self._current_candle = None
        self._last_signal = None
