"""
IT [Tangram 3.0] parameter schema — Pydantic v2 models.

Models the full IT parameter schema from PRD §12, including:
  - §12.2 Seção Gráfico (timeframe, sentido das operações)
  - §12.3 Parâmetros gerais de entrada
  - §12.4 All 14 indicators with their exact fields + option enums
  - §12.5 Section order (enforced by ITParams field ordering)

Cross-field validation (RISK-04) is in it_validators.py and applied
via a model_validator in ITParams.

Usage:
    from strategies.it_params_schema import ITParams
    params = ITParams(**payload)   # raises ValidationError on violation
"""
from __future__ import annotations

from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


# ─── Shared enums ────────────────────────────────────────────────────────────

class ModoOperacaoEnum(str, Enum):
    apenas_entradas = "apenas_entradas"
    apenas_saidas = "apenas_saidas"
    entradas_e_saidas = "entradas_e_saidas"


class TipoMediaEnum(str, Enum):
    simples = "simples"
    exponencial = "exponencial"
    wilder = "wilder"


class ValorUsadoEnum(str, Enum):
    fechamento = "fechamento"
    abertura = "abertura"
    maxima = "maxima"
    minima = "minima"


class TendenciaDirectionEnum(str, Enum):
    ficando_mais_forte = "ficando_mais_forte"
    ficando_mais_fraca = "ficando_mais_fraca"


# ─── Seção Gráfico (§12.2) ────────────────────────────────────────────────────

class GraficoSection(BaseModel):
    tipo: Literal["candlestick", "heikin_ashi"] = "candlestick"
    tempo_grafico: Literal["1min", "5min", "10min", "15min", "30min", "60min"] = "5min"
    sentido_operacoes: Literal["apenas_comprado", "apenas_vendido", "comprado_e_vendido"] = "comprado_e_vendido"


# ─── Parâmetros gerais de entrada (§12.3) ────────────────────────────────────

class EntradaGeralSection(BaseModel):
    modo_operacao_global: Literal["candle_aberto", "candle_fechado"] = "candle_fechado"
    tipo_envio_ordem: Literal["a_mercado", "limite"] = "a_mercado"
    # Condicional — LIMITE
    sentido_spread: Optional[Literal["a_favor", "contra"]] = None
    spread_valor: Optional[float] = None
    tempo_execucao_limite: Optional[int] = None  # seconds
    operacao_na_expiracao: Optional[Literal["executar_a_mercado", "cancelar"]] = None
    entrada_por_indicadores: Literal["todos", "pelo_menos_um"] = "todos"

    @model_validator(mode="after")
    def _validate_limite_conditionals(self) -> "EntradaGeralSection":
        if self.tipo_envio_ordem == "limite":
            if self.sentido_spread is None:
                raise ValueError("sentido_spread é obrigatório quando tipo_envio_ordem='limite'")
            if self.spread_valor is None:
                raise ValueError("spread_valor é obrigatório quando tipo_envio_ordem='limite'")
        return self


# ─── Base indicator config (common fields) ───────────────────────────────────

class BaseIndicadorCfg(BaseModel):
    habilitado: bool = False
    habilitar_inversao: bool = False
    modo_operacao: Optional[ModoOperacaoEnum] = None

    @model_validator(mode="after")
    def _require_common_when_enabled(self) -> "BaseIndicadorCfg":
        if self.habilitado:
            if self.modo_operacao is None:
                raise ValueError("modo_operacao é obrigatório quando o indicador está habilitado")
        return self


# ─── Indicador 1 — Médias Móveis ─────────────────────────────────────────────

class FormaUsoMediasEnum(str, Enum):
    cruzamento_das_medias = "cruzamento_das_medias"
    posicao_das_medias = "posicao_das_medias"


class MediasMoveisCfg(BaseIndicadorCfg):
    forma_uso: Optional[FormaUsoMediasEnum] = None
    # Média Curta
    media_curta_tipo: Optional[TipoMediaEnum] = None
    media_curta_valor_usado: Optional[ValorUsadoEnum] = None
    media_curta_periodos: Optional[int] = Field(default=None, ge=1)
    media_curta_deslocamento: Optional[int] = Field(default=None, ge=0)
    # Média Longa
    media_longa_tipo: Optional[TipoMediaEnum] = None
    media_longa_valor_usado: Optional[ValorUsadoEnum] = None
    media_longa_periodos: Optional[int] = Field(default=None, ge=1)
    media_longa_deslocamento: Optional[int] = Field(default=None, ge=0)

    @model_validator(mode="after")
    def _validate_when_enabled(self) -> "MediasMoveisCfg":
        if self.habilitado:
            required = [
                ("forma_uso", self.forma_uso),
                ("media_curta_tipo", self.media_curta_tipo),
                ("media_curta_valor_usado", self.media_curta_valor_usado),
                ("media_curta_periodos", self.media_curta_periodos),
                ("media_longa_tipo", self.media_longa_tipo),
                ("media_longa_valor_usado", self.media_longa_valor_usado),
                ("media_longa_periodos", self.media_longa_periodos),
            ]
            for field_name, val in required:
                if val is None:
                    raise ValueError(f"{field_name} é obrigatório quando Médias Móveis está habilitado")
        return self


# ─── Indicador 2 — Cruzamento de 3 Médias Móveis ─────────────────────────────

class FormaUsoCruzamento3Enum(str, Enum):
    cruzamento_das_medias = "cruzamento_das_medias"
    posicao_das_medias = "posicao_das_medias"


class Cruzamento3MediasCfg(BaseIndicadorCfg):
    forma_uso: Optional[FormaUsoCruzamento3Enum] = None
    alinhamento_total: bool = False
    # Média Curta (MC)
    mc_tipo: Optional[TipoMediaEnum] = None
    mc_valor_usado: Optional[ValorUsadoEnum] = None
    mc_periodos: Optional[int] = Field(default=None, ge=1)
    # Média Intermediária (MI)
    mi_tipo: Optional[TipoMediaEnum] = None
    mi_valor_usado: Optional[ValorUsadoEnum] = None
    mi_periodos: Optional[int] = Field(default=None, ge=1)
    # Média Longa (ML)
    ml_tipo: Optional[TipoMediaEnum] = None
    ml_valor_usado: Optional[ValorUsadoEnum] = None
    ml_periodos: Optional[int] = Field(default=None, ge=1)

    @model_validator(mode="after")
    def _validate_when_enabled(self) -> "Cruzamento3MediasCfg":
        if self.habilitado:
            required = [
                ("forma_uso", self.forma_uso),
                ("mc_tipo", self.mc_tipo),
                ("mc_valor_usado", self.mc_valor_usado),
                ("mc_periodos", self.mc_periodos),
                ("mi_tipo", self.mi_tipo),
                ("mi_valor_usado", self.mi_valor_usado),
                ("mi_periodos", self.mi_periodos),
                ("ml_tipo", self.ml_tipo),
                ("ml_valor_usado", self.ml_valor_usado),
                ("ml_periodos", self.ml_periodos),
            ]
            for field_name, val in required:
                if val is None:
                    raise ValueError(f"{field_name} é obrigatório quando Cruzamento de 3 Médias está habilitado")
        return self


# ─── Indicador 3 — HiLo Activator ────────────────────────────────────────────

class FormaUsoHiLoEnum(str, Enum):
    mudanca_no_sentido = "mudanca_no_sentido"
    sentido_da_escada = "sentido_da_escada"


class HiLoActivatorCfg(BaseIndicadorCfg):
    forma_uso: Optional[FormaUsoHiLoEnum] = None
    numero_periodos: Optional[int] = Field(default=None, ge=1)

    @model_validator(mode="after")
    def _validate_when_enabled(self) -> "HiLoActivatorCfg":
        if self.habilitado:
            if self.forma_uso is None:
                raise ValueError("forma_uso é obrigatório quando HiLo Activator está habilitado")
            if self.numero_periodos is None:
                raise ValueError("numero_periodos é obrigatório quando HiLo Activator está habilitado")
        return self


# ─── Indicador 4 — MACD ───────────────────────────────────────────────────────

class FormaUsoMACDEnum(str, Enum):
    cruzamento_macd_sinal = "cruzamento_macd_sinal"
    macd_acima_abaixo_zero = "macd_acima_abaixo_zero"


class MACDCfg(BaseIndicadorCfg):
    forma_uso: Optional[FormaUsoMACDEnum] = None
    valor_usado: Optional[ValorUsadoEnum] = None
    tipo_media: Optional[TipoMediaEnum] = None
    media_curta_periodos: Optional[int] = Field(default=None, ge=1)
    media_longa_periodos: Optional[int] = Field(default=None, ge=1)
    linha_sinal_periodos: Optional[int] = Field(default=None, ge=1)
    # Filter toggle — cross-field (RISK-04)
    filtro_de_valor: bool = False
    valor_do_filtro: Optional[float] = None  # revealed when filtro_de_valor=True

    @model_validator(mode="after")
    def _validate_when_enabled(self) -> "MACDCfg":
        if self.habilitado:
            required = [
                ("forma_uso", self.forma_uso),
                ("valor_usado", self.valor_usado),
                ("tipo_media", self.tipo_media),
                ("media_curta_periodos", self.media_curta_periodos),
                ("media_longa_periodos", self.media_longa_periodos),
                ("linha_sinal_periodos", self.linha_sinal_periodos),
            ]
            for field_name, val in required:
                if val is None:
                    raise ValueError(f"{field_name} é obrigatório quando MACD está habilitado")
            # RISK-04: filter toggle cross-field rule
            if self.filtro_de_valor and self.valor_do_filtro is None:
                raise ValueError(
                    "valor_do_filtro é obrigatório quando filtro_de_valor está ativo (RISK-04)"
                )
        return self


# ─── Indicador 5 — ADX DI+/DI− ───────────────────────────────────────────────

class FormaUsoADXEnum(str, Enum):
    cruzamento_di_mais_di_menos = "cruzamento_di_mais_di_menos"
    di_mais_acima_abaixo_di_menos = "di_mais_acima_abaixo_di_menos"


class ADXCfg(BaseIndicadorCfg):
    forma_uso: Optional[FormaUsoADXEnum] = None
    di_periodos: Optional[int] = Field(default=None, ge=1)
    adx_suavizador: Optional[int] = Field(default=None, ge=1)
    # Filter toggles — cross-field (RISK-04)
    filtro_valor_minimo: bool = False
    adx_valor_minimo: Optional[float] = None
    filtro_valor_maximo: bool = False
    adx_valor_maximo: Optional[float] = None
    filtro_aumento_diminuicao: bool = False
    tendencia_direction: Optional[TendenciaDirectionEnum] = None  # revealed when toggle on

    @model_validator(mode="after")
    def _validate_when_enabled(self) -> "ADXCfg":
        if self.habilitado:
            if self.forma_uso is None:
                raise ValueError("forma_uso é obrigatório quando ADX está habilitado")
            if self.di_periodos is None:
                raise ValueError("di_periodos é obrigatório quando ADX está habilitado")
            if self.adx_suavizador is None:
                raise ValueError("adx_suavizador é obrigatório quando ADX está habilitado")
            # RISK-04: filter toggle cross-field rules
            if self.filtro_valor_minimo and self.adx_valor_minimo is None:
                raise ValueError(
                    "adx_valor_minimo é obrigatório quando filtro_valor_minimo está ativo (RISK-04)"
                )
            if self.filtro_valor_maximo and self.adx_valor_maximo is None:
                raise ValueError(
                    "adx_valor_maximo é obrigatório quando filtro_valor_maximo está ativo (RISK-04)"
                )
            if self.filtro_aumento_diminuicao and self.tendencia_direction is None:
                raise ValueError(
                    "tendencia_direction é obrigatório quando filtro_aumento_diminuicao está ativo (RISK-04)"
                )
        return self


# ─── Indicador 6 — Estocástico (Pleno) ───────────────────────────────────────

class FormaUsoEstocEnum(str, Enum):
    cruzamento_k_d = "cruzamento_k_d"
    niveis_sobrecompra_sobrevenda = "niveis_sobrecompra_sobrevenda"


class EstocasticoCfg(BaseIndicadorCfg):
    forma_uso: Optional[FormaUsoEstocEnum] = None
    periodos_k: Optional[int] = Field(default=None, ge=1)
    periodos_d: Optional[int] = Field(default=None, ge=1)
    suavizacao: Optional[int] = Field(default=None, ge=1)
    nivel_sobrevendido: Optional[float] = None
    nivel_sobrecomprado: Optional[float] = None

    @model_validator(mode="after")
    def _validate_when_enabled(self) -> "EstocasticoCfg":
        if self.habilitado:
            required = [
                ("forma_uso", self.forma_uso),
                ("periodos_k", self.periodos_k),
                ("periodos_d", self.periodos_d),
                ("suavizacao", self.suavizacao),
                ("nivel_sobrevendido", self.nivel_sobrevendido),
                ("nivel_sobrecomprado", self.nivel_sobrecomprado),
            ]
            for field_name, val in required:
                if val is None:
                    raise ValueError(f"{field_name} é obrigatório quando Estocástico está habilitado")
        return self


# ─── Indicador 7 — VWAP ───────────────────────────────────────────────────────

class FormaUsoVWAPEnum(str, Enum):
    rompimento = "rompimento"
    compra_acima_vende_abaixo = "compra_acima_vende_abaixo"
    vende_acima_compra_abaixo = "vende_acima_compra_abaixo"


class VWAPCfg(BaseIndicadorCfg):
    # VWAP: âncora diária — no extra period params
    forma_uso: Optional[FormaUsoVWAPEnum] = None

    @model_validator(mode="after")
    def _validate_when_enabled(self) -> "VWAPCfg":
        if self.habilitado:
            if self.forma_uso is None:
                raise ValueError("forma_uso é obrigatório quando VWAP está habilitado")
        return self


# ─── Indicador 8 — IFR (RSI) ──────────────────────────────────────────────────

class FormaUsoIFREnum(str, Enum):
    cruzamento_ifr = "cruzamento_ifr"
    ifr_acima_abaixo_nivel = "ifr_acima_abaixo_nivel"


class IFRCfg(BaseIndicadorCfg):
    forma_uso: Optional[FormaUsoIFREnum] = None
    valor_usado: Optional[ValorUsadoEnum] = None
    numero_periodos: Optional[int] = Field(default=None, ge=1)
    nivel_sobrevendido: Optional[float] = None
    nivel_sobrecomprado: Optional[float] = None

    @model_validator(mode="after")
    def _validate_when_enabled(self) -> "IFRCfg":
        if self.habilitado:
            required = [
                ("forma_uso", self.forma_uso),
                ("valor_usado", self.valor_usado),
                ("numero_periodos", self.numero_periodos),
                ("nivel_sobrevendido", self.nivel_sobrevendido),
                ("nivel_sobrecomprado", self.nivel_sobrecomprado),
            ]
            for field_name, val in required:
                if val is None:
                    raise ValueError(f"{field_name} é obrigatório quando IFR está habilitado")
        return self


# ─── Indicador 9 — Bandas de Bollinger ───────────────────────────────────────

class FormaUsoBollingerEnum(str, Enum):
    cruzamento = "cruzamento"
    preco_acima_abaixo_banda = "preco_acima_abaixo_banda"


class BollingerCfg(BaseIndicadorCfg):
    forma_uso: Optional[FormaUsoBollingerEnum] = None
    valor_usado: Optional[ValorUsadoEnum] = None
    numero_periodos: Optional[int] = Field(default=None, ge=1)
    multiplicador_desvio: Optional[float] = Field(default=None, gt=0)

    @model_validator(mode="after")
    def _validate_when_enabled(self) -> "BollingerCfg":
        if self.habilitado:
            required = [
                ("forma_uso", self.forma_uso),
                ("valor_usado", self.valor_usado),
                ("numero_periodos", self.numero_periodos),
                ("multiplicador_desvio", self.multiplicador_desvio),
            ]
            for field_name, val in required:
                if val is None:
                    raise ValueError(f"{field_name} é obrigatório quando Bandas de Bollinger está habilitado")
        return self


# ─── Indicador 10 — Stop ATR ──────────────────────────────────────────────────

class FormaUsoStopATREnum(str, Enum):
    mudanca_no_sentido = "mudanca_no_sentido"
    sentido_stop_atr = "sentido_stop_atr"


class TipoMediaATREnum(str, Enum):
    simples = "simples"
    wilder = "wilder"


class StopATRCfg(BaseIndicadorCfg):
    forma_uso: Optional[FormaUsoStopATREnum] = None
    media_tipo: Optional[TipoMediaATREnum] = None
    media_periodos: Optional[int] = Field(default=None, ge=1)
    desvio_multiplicador: Optional[float] = Field(default=None, gt=0)

    @model_validator(mode="after")
    def _validate_when_enabled(self) -> "StopATRCfg":
        if self.habilitado:
            required = [
                ("forma_uso", self.forma_uso),
                ("media_tipo", self.media_tipo),
                ("media_periodos", self.media_periodos),
                ("desvio_multiplicador", self.desvio_multiplicador),
            ]
            for field_name, val in required:
                if val is None:
                    raise ValueError(f"{field_name} é obrigatório quando Stop ATR está habilitado")
        return self


# ─── Indicador 11 — SAR Parabólico ───────────────────────────────────────────

class FormaUsoSAREnum(str, Enum):
    mudanca_no_sentido = "mudanca_no_sentido"
    sentido_dos_pontos = "sentido_dos_pontos"


class SARParabolicoCfg(BaseIndicadorCfg):
    forma_uso: Optional[FormaUsoSAREnum] = None
    fator_aceleracao_inicial: Optional[float] = Field(default=None, gt=0)
    incremento_fator_aceleracao: Optional[float] = Field(default=None, gt=0)
    fator_aceleracao_maximo: Optional[float] = Field(default=None, gt=0)

    @model_validator(mode="after")
    def _validate_when_enabled(self) -> "SARParabolicoCfg":
        if self.habilitado:
            required = [
                ("forma_uso", self.forma_uso),
                ("fator_aceleracao_inicial", self.fator_aceleracao_inicial),
                ("incremento_fator_aceleracao", self.incremento_fator_aceleracao),
                ("fator_aceleracao_maximo", self.fator_aceleracao_maximo),
            ]
            for field_name, val in required:
                if val is None:
                    raise ValueError(f"{field_name} é obrigatório quando SAR Parabólico está habilitado")
        return self


# ─── Indicador 12 — OBV ───────────────────────────────────────────────────────

class FormaUsoOBVEnum(str, Enum):
    mudanca_no_sentido = "mudanca_no_sentido"
    continuacao_obv = "continuacao_obv"


class TipoMediaOBVEnum(str, Enum):
    simples = "simples"
    wilder = "wilder"


class OBVCfg(BaseIndicadorCfg):
    forma_uso: Optional[FormaUsoOBVEnum] = None
    media_tipo: Optional[TipoMediaOBVEnum] = None
    media_periodos: Optional[int] = Field(default=None, ge=1)
    desvio_multiplicador: Optional[float] = Field(default=None, gt=0)
    # RISK-04: must be positive integer
    candles_mesmo_sentido: Optional[int] = Field(default=None)

    @model_validator(mode="after")
    def _validate_when_enabled(self) -> "OBVCfg":
        if self.habilitado:
            required = [
                ("forma_uso", self.forma_uso),
                ("media_tipo", self.media_tipo),
                ("media_periodos", self.media_periodos),
                ("desvio_multiplicador", self.desvio_multiplicador),
                ("candles_mesmo_sentido", self.candles_mesmo_sentido),
            ]
            for field_name, val in required:
                if val is None:
                    raise ValueError(f"{field_name} é obrigatório quando OBV está habilitado")
            # RISK-04: candles_mesmo_sentido must be positive
            if self.candles_mesmo_sentido is not None and self.candles_mesmo_sentido <= 0:
                raise ValueError(
                    "candles_mesmo_sentido: Informe um número positivo (RISK-04)"
                )
        return self


# ─── Indicador 13 — Detector de Topos e Fundos ───────────────────────────────

class FormaUsoDetectorEnum(str, Enum):
    mudanca_no_sinal = "mudanca_no_sinal"
    sentido_do_topos_fundos = "sentido_do_topos_fundos"


class DetectorTopFundosCfg(BaseIndicadorCfg):
    forma_uso: Optional[FormaUsoDetectorEnum] = None
    numero_periodos: Optional[Literal[1, 2, 3, 4]] = None  # button selection 1–4

    @model_validator(mode="after")
    def _validate_when_enabled(self) -> "DetectorTopFundosCfg":
        if self.habilitado:
            if self.forma_uso is None:
                raise ValueError("forma_uso é obrigatório quando Detector de Topos e Fundos está habilitado")
            if self.numero_periodos is None:
                raise ValueError("numero_periodos é obrigatório quando Detector de Topos e Fundos está habilitado")
        return self


# ─── Indicador 14 — Pontos Pivot ─────────────────────────────────────────────

class PontosPivotCfg(BaseIndicadorCfg):
    # No forma_uso for Pontos Pivot per PRD §12.4
    dx_distancia_entrada: Optional[float] = Field(default=None, gt=0)
    utilizar_suporte1: bool = False
    utilizar_suporte2: bool = False
    utilizar_resistencia1: bool = False
    utilizar_resistencia2: bool = False
    habilitar_contra_tendencia: bool = False

    @model_validator(mode="after")
    def _validate_when_enabled(self) -> "PontosPivotCfg":
        if self.habilitado:
            if self.dx_distancia_entrada is None:
                raise ValueError("dx_distancia_entrada é obrigatório quando Pontos Pivot está habilitado")
        return self


# ─── Root ITParams model ──────────────────────────────────────────────────────

class ITParams(BaseModel):
    """
    Full IT [Tangram 3.0] parameter schema.

    §12.3 general entry params at the top level.
    §12.4 all 14 indicators as sub-models.
    """
    # §12.3 General entry params
    modo_operacao_global: Literal["candle_aberto", "candle_fechado"] = "candle_fechado"
    tipo_envio_ordem: Literal["a_mercado", "limite"] = "a_mercado"
    sentido_spread: Optional[Literal["a_favor", "contra"]] = None
    spread_valor: Optional[float] = None
    tempo_execucao_limite: Optional[int] = None
    operacao_na_expiracao: Optional[Literal["executar_a_mercado", "cancelar"]] = None
    entrada_por_indicadores: Literal["todos", "pelo_menos_um"] = "todos"

    # §12.4 All 14 indicators
    medias_moveis: MediasMoveisCfg = Field(default_factory=lambda: MediasMoveisCfg(habilitado=False))
    cruzamento_3_medias: Cruzamento3MediasCfg = Field(default_factory=lambda: Cruzamento3MediasCfg(habilitado=False))
    hilo_activator: HiLoActivatorCfg = Field(default_factory=lambda: HiLoActivatorCfg(habilitado=False))
    macd: MACDCfg = Field(default_factory=lambda: MACDCfg(habilitado=False))
    adx: ADXCfg = Field(default_factory=lambda: ADXCfg(habilitado=False))
    estocastico: EstocasticoCfg = Field(default_factory=lambda: EstocasticoCfg(habilitado=False))
    vwap: VWAPCfg = Field(default_factory=lambda: VWAPCfg(habilitado=False))
    ifr: IFRCfg = Field(default_factory=lambda: IFRCfg(habilitado=False))
    bollinger: BollingerCfg = Field(default_factory=lambda: BollingerCfg(habilitado=False))
    stop_atr: StopATRCfg = Field(default_factory=lambda: StopATRCfg(habilitado=False))
    sar_parabolico: SARParabolicoCfg = Field(default_factory=lambda: SARParabolicoCfg(habilitado=False))
    obv: OBVCfg = Field(default_factory=lambda: OBVCfg(habilitado=False))
    detector_top_fundos: DetectorTopFundosCfg = Field(default_factory=lambda: DetectorTopFundosCfg(habilitado=False))
    pontos_pivot: PontosPivotCfg = Field(default_factory=lambda: PontosPivotCfg(habilitado=False))

    @model_validator(mode="after")
    def _validate_at_least_one_enabled(self) -> "ITParams":
        """RISK-04: At least one indicator must be enabled."""
        indicators = [
            self.medias_moveis,
            self.cruzamento_3_medias,
            self.hilo_activator,
            self.macd,
            self.adx,
            self.estocastico,
            self.vwap,
            self.ifr,
            self.bollinger,
            self.stop_atr,
            self.sar_parabolico,
            self.obv,
            self.detector_top_fundos,
            self.pontos_pivot,
        ]
        if not any(ind.habilitado for ind in indicators):
            raise ValueError(
                "pelo menos um indicador deve estar habilitado (RISK-04)"
            )
        return self

    @model_validator(mode="after")
    def _validate_limite_conditionals(self) -> "ITParams":
        """Enforce LIMITE order conditional fields."""
        if self.tipo_envio_ordem == "limite":
            if self.sentido_spread is None:
                raise ValueError("sentido_spread é obrigatório quando tipo_envio_ordem='limite'")
            if self.spread_valor is None:
                raise ValueError("spread_valor é obrigatório quando tipo_envio_ordem='limite'")
        return self
