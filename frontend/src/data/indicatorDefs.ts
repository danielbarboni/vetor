/**
 * indicatorDefs.ts — Declarative definitions for all 14 IT [Tangram 3.0] indicators.
 *
 * Authority: PRD §12.4 (fields, options), §12.5 (section order).
 * All 14 indicators MUST be present — project constraint.
 *
 * Each definition drives:
 *  - IndicadorRow rendering (which fields appear when habilitado=true)
 *  - Conditional reveals (filter toggle → extra field)
 *  - Field types: 'number' | 'decimal' | 'dropdown' | 'toggle' | 'segment' | 'button-group'
 */

export type FieldType = 'number' | 'decimal' | 'dropdown' | 'toggle' | 'segment' | 'button-group'

export interface FieldOption {
  value: string
  label: string
}

export interface IndicatorField {
  key: string
  label: string
  type: FieldType
  options?: FieldOption[]
  defaultValue?: string | number | boolean
  hint?: string
  /** When set: this field is revealed only when the named sibling toggle is true */
  revealedBy?: string
  /** Positive integer validation hint */
  positiveInteger?: boolean
}

export interface IndicatorDef {
  id: string
  name: string
  specificFields: IndicatorField[]
  formaDeUsoOptions: FieldOption[]
}

// ─── Common re-usable option sets ───────────────────────────────────────────

const TIPO_MEDIA_OPTIONS: FieldOption[] = [
  { value: 'simples', label: 'Simples (Aritmética)' },
  { value: 'exponencial', label: 'Exponencial' },
]

const TIPO_MEDIA_WILDER_OPTIONS: FieldOption[] = [
  { value: 'simples', label: 'Simples/Aritmética' },
  { value: 'wilder', label: 'Wilder/Exponencial' },
]

const VALOR_USADO_OPTIONS: FieldOption[] = [
  { value: 'fechamento', label: 'Fechamento' },
  { value: 'abertura', label: 'Abertura' },
  { value: 'maxima', label: 'Máxima' },
  { value: 'minima', label: 'Mínima' },
]

/** Shared modo de operação options — used by IndicadorRow for all indicators */
export const INDICADOR_MODO_OPERACAO_OPTIONS: FieldOption[] = [
  { value: 'apenas_entradas', label: 'Apenas entradas' },
  { value: 'apenas_saidas', label: 'Apenas saídas' },
  { value: 'entradas_e_saidas', label: 'Entradas e saídas' },
]

// ─── All 14 indicator definitions (PRD §12.4, in §12.5 order) ───────────────

export const INDICATOR_DEFS: IndicatorDef[] = [
  // 1 — Médias Móveis
  {
    id: 'medias_moveis',
    name: 'Médias Móveis',
    formaDeUsoOptions: [
      { value: 'cruzamento_das_medias', label: 'Cruzamento das médias' },
      { value: 'posicao_das_medias', label: 'Posição das médias (preço acima/abaixo)' },
    ],
    specificFields: [
      { key: 'media_curta_tipo', label: 'Média Curta — Tipo', type: 'dropdown', options: TIPO_MEDIA_OPTIONS, defaultValue: 'simples' },
      { key: 'media_curta_valor_usado', label: 'Média Curta — Valor usado', type: 'dropdown', options: VALOR_USADO_OPTIONS, defaultValue: 'fechamento' },
      { key: 'media_curta_periodos', label: 'Média Curta — Número de períodos', type: 'number', defaultValue: 9 },
      { key: 'media_curta_deslocamento', label: 'Média Curta — Deslocamento', type: 'number', defaultValue: 0 },
      { key: 'media_longa_tipo', label: 'Média Longa — Tipo', type: 'dropdown', options: TIPO_MEDIA_OPTIONS, defaultValue: 'simples' },
      { key: 'media_longa_valor_usado', label: 'Média Longa — Valor usado', type: 'dropdown', options: VALOR_USADO_OPTIONS, defaultValue: 'fechamento' },
      { key: 'media_longa_periodos', label: 'Média Longa — Número de períodos', type: 'number', defaultValue: 40 },
      { key: 'media_longa_deslocamento', label: 'Média Longa — Deslocamento', type: 'number', defaultValue: 0 },
    ],
  },

  // 2 — Cruzamento de 3 Médias Móveis
  {
    id: 'cruzamento_3_medias',
    name: 'Cruzamento de 3 Médias Móveis',
    formaDeUsoOptions: [
      { value: 'cruzamento_das_medias', label: 'Cruzamento das médias' },
      { value: 'posicao_das_medias', label: 'Posição das médias' },
    ],
    specificFields: [
      { key: 'alinhamento_total', label: 'Alinhamento Total', type: 'toggle', defaultValue: false, hint: 'Quando ativo: exige que as 3 médias estejam alinhadas (curta > intermediária > longa para compra)' },
      { key: 'mc_tipo', label: 'Média Curta (MC) — Tipo', type: 'dropdown', options: TIPO_MEDIA_OPTIONS, defaultValue: 'simples' },
      { key: 'mc_valor_usado', label: 'Média Curta (MC) — Valor usado', type: 'dropdown', options: VALOR_USADO_OPTIONS, defaultValue: 'fechamento' },
      { key: 'mc_periodos', label: 'Média Curta (MC) — Número de períodos', type: 'number' },
      { key: 'mi_tipo', label: 'Média Intermediária (MI) — Tipo', type: 'dropdown', options: TIPO_MEDIA_OPTIONS, defaultValue: 'simples' },
      { key: 'mi_valor_usado', label: 'Média Intermediária (MI) — Valor usado', type: 'dropdown', options: VALOR_USADO_OPTIONS, defaultValue: 'fechamento' },
      { key: 'mi_periodos', label: 'Média Intermediária (MI) — Número de períodos', type: 'number' },
      { key: 'ml_tipo', label: 'Média Longa (ML) — Tipo', type: 'dropdown', options: TIPO_MEDIA_OPTIONS, defaultValue: 'simples' },
      { key: 'ml_valor_usado', label: 'Média Longa (ML) — Valor usado', type: 'dropdown', options: VALOR_USADO_OPTIONS, defaultValue: 'fechamento' },
      { key: 'ml_periodos', label: 'Média Longa (ML) — Número de períodos', type: 'number' },
    ],
  },

  // 3 — HiLo Activator
  {
    id: 'hilo_activator',
    name: 'HiLo Activator',
    formaDeUsoOptions: [
      { value: 'mudanca_no_sentido', label: 'Mudança no sentido' },
      { value: 'sentido_da_escada', label: 'Sentido da escada do HiLo' },
    ],
    specificFields: [
      { key: 'numero_periodos', label: 'Número de períodos', type: 'number' },
    ],
  },

  // 4 — MACD
  {
    id: 'macd',
    name: 'MACD',
    formaDeUsoOptions: [
      { value: 'cruzamento_macd_sinal', label: 'Cruzamento da linha MACD com a linha de sinal' },
      { value: 'macd_acima_abaixo_zero', label: 'Linha MACD acima/abaixo de zero' },
    ],
    specificFields: [
      { key: 'valor_usado', label: 'Valor usado', type: 'dropdown', options: VALOR_USADO_OPTIONS, defaultValue: 'fechamento' },
      { key: 'tipo_media', label: 'Tipo de média', type: 'dropdown', options: TIPO_MEDIA_OPTIONS, defaultValue: 'exponencial' },
      { key: 'media_curta_periodos', label: 'Média curta — Número de períodos', type: 'number', defaultValue: 12 },
      { key: 'media_longa_periodos', label: 'Média longa — Número de períodos', type: 'number', defaultValue: 26 },
      { key: 'linha_sinal_periodos', label: 'Linha de sinal — Número de períodos', type: 'number', defaultValue: 9 },
      { key: 'filtro_de_valor', label: 'Filtro de valor', type: 'toggle', defaultValue: false, hint: 'Comprar/vender apenas com MACD abaixo/acima do valor do filtro' },
      { key: 'valor_do_filtro', label: 'Valor do filtro', type: 'decimal', defaultValue: 0, revealedBy: 'filtro_de_valor' },
    ],
  },

  // 5 — ADX DI+/DI−
  {
    id: 'adx',
    name: 'ADX — DI+/DI−',
    formaDeUsoOptions: [
      { value: 'cruzamento_di_mais_di_menos', label: 'Cruzamento do DI+ com DI−' },
      { value: 'di_mais_acima_abaixo_di_menos', label: 'DI+ acima/abaixo do DI−' },
    ],
    specificFields: [
      { key: 'di_periodos', label: 'DI — Número de períodos', type: 'number', defaultValue: 14 },
      { key: 'adx_suavizador', label: 'ADX — Suavizador (número de períodos)', type: 'number', defaultValue: 14 },
      { key: 'filtro_valor_minimo', label: 'Filtro de valor mínimo do ADX', type: 'toggle', defaultValue: false },
      { key: 'adx_valor_minimo', label: 'Valor mínimo do ADX', type: 'decimal', revealedBy: 'filtro_valor_minimo' },
      { key: 'filtro_valor_maximo', label: 'Filtro de valor máximo do ADX', type: 'toggle', defaultValue: false },
      { key: 'adx_valor_maximo', label: 'Valor máximo do ADX', type: 'decimal', revealedBy: 'filtro_valor_maximo' },
      { key: 'filtro_aumento_diminuicao', label: 'Filtro de Aumento/Diminuição', type: 'toggle', defaultValue: false },
      {
        key: 'tendencia_direction',
        label: 'Permitir operações com tendência',
        type: 'dropdown',
        options: [
          { value: 'ficando_mais_forte', label: 'Ficando mais forte' },
          { value: 'ficando_mais_fraca', label: 'Ficando mais fraca' },
        ],
        revealedBy: 'filtro_aumento_diminuicao',
      },
    ],
  },

  // 6 — Estocástico (Pleno)
  {
    id: 'estocastico',
    name: 'Estocástico (Pleno)',
    formaDeUsoOptions: [
      { value: 'cruzamento_k_d', label: 'Cruzamento do %K com %D' },
      { value: 'niveis_sobrecompra_sobrevenda', label: 'Níveis de sobrecompra/sobrevenda' },
    ],
    specificFields: [
      { key: 'periodos_k', label: 'Períodos %K', type: 'number', defaultValue: 5 },
      { key: 'periodos_d', label: 'Períodos %D', type: 'number', defaultValue: 3 },
      { key: 'suavizacao', label: 'Suavização', type: 'number', defaultValue: 3 },
      { key: 'nivel_sobrevendido', label: 'Nível sobrevendido', type: 'number', defaultValue: 20 },
      { key: 'nivel_sobrecomprado', label: 'Nível sobrecomprado', type: 'number', defaultValue: 80 },
    ],
  },

  // 7 — VWAP
  {
    id: 'vwap',
    name: 'VWAP',
    formaDeUsoOptions: [
      { value: 'rompimento', label: 'Rompimento' },
      { value: 'compra_acima_vende_abaixo', label: 'Compra acima / Vende abaixo' },
      { value: 'vende_acima_compra_abaixo', label: 'Vende acima / Compra abaixo' },
    ],
    specificFields: [
      // VWAP: âncora diária — no extra period fields (PRD §12.4)
    ],
  },

  // 8 — IFR (RSI)
  {
    id: 'ifr',
    name: 'IFR (RSI)',
    formaDeUsoOptions: [
      { value: 'cruzamento_ifr', label: 'Cruzamento do IFR' },
      { value: 'ifr_acima_abaixo_nivel', label: 'IFR acima/abaixo de nível' },
    ],
    specificFields: [
      { key: 'valor_usado', label: 'Valor usado', type: 'dropdown', options: VALOR_USADO_OPTIONS, defaultValue: 'fechamento' },
      { key: 'numero_periodos', label: 'Número de períodos', type: 'number', defaultValue: 14 },
      { key: 'nivel_sobrevendido', label: 'Nível sobrevendido', type: 'number', defaultValue: 30 },
      { key: 'nivel_sobrecomprado', label: 'Nível sobrecomprado', type: 'number', defaultValue: 70 },
    ],
  },

  // 9 — Bandas de Bollinger
  {
    id: 'bollinger',
    name: 'Bandas de Bollinger',
    formaDeUsoOptions: [
      { value: 'cruzamento', label: 'Cruzamento' },
      { value: 'preco_acima_abaixo_banda', label: 'Preço acima/abaixo da banda' },
    ],
    specificFields: [
      { key: 'valor_usado', label: 'Valor usado', type: 'dropdown', options: VALOR_USADO_OPTIONS, defaultValue: 'fechamento' },
      { key: 'numero_periodos', label: 'Número de períodos', type: 'number', defaultValue: 14 },
      { key: 'multiplicador_desvio', label: 'Multiplicador de desvio', type: 'decimal', defaultValue: 2.0 },
    ],
  },

  // 10 — Stop ATR
  {
    id: 'stop_atr',
    name: 'Stop ATR',
    formaDeUsoOptions: [
      { value: 'mudanca_no_sentido', label: 'Mudança no sentido' },
      { value: 'sentido_stop_atr', label: 'Sentido do Stop ATR' },
    ],
    specificFields: [
      { key: 'media_tipo', label: 'Média — Tipo', type: 'dropdown', options: TIPO_MEDIA_WILDER_OPTIONS, defaultValue: 'wilder' },
      { key: 'media_periodos', label: 'Média — Número de períodos', type: 'number' },
      { key: 'desvio_multiplicador', label: 'Desvio — Multiplicador', type: 'decimal', defaultValue: 10.0 },
    ],
  },

  // 11 — SAR Parabólico
  {
    id: 'sar_parabolico',
    name: 'SAR Parabólico',
    formaDeUsoOptions: [
      { value: 'mudanca_no_sentido', label: 'Mudança no sentido' },
      { value: 'sentido_dos_pontos', label: 'Sentido dos pontos do SAR' },
    ],
    specificFields: [
      { key: 'fator_aceleracao_inicial', label: 'Fator de aceleração inicial', type: 'decimal', defaultValue: 0.02 },
      { key: 'incremento_fator_aceleracao', label: 'Incremento do fator de aceleração', type: 'decimal', defaultValue: 0.02 },
      { key: 'fator_aceleracao_maximo', label: 'Fator de aceleração máximo', type: 'decimal', defaultValue: 0.20 },
    ],
  },

  // 12 — OBV (On-Balance Volume)
  {
    id: 'obv',
    name: 'OBV (On-Balance Volume)',
    formaDeUsoOptions: [
      { value: 'mudanca_no_sentido', label: 'Mudança no sentido' },
      { value: 'continuacao_obv', label: 'Continuação do OBV' },
    ],
    specificFields: [
      { key: 'media_tipo', label: 'Média do OBV — Tipo', type: 'dropdown', options: TIPO_MEDIA_WILDER_OPTIONS, defaultValue: 'simples' },
      { key: 'media_periodos', label: 'Média do OBV — Número de períodos', type: 'number', defaultValue: 15 },
      { key: 'desvio_multiplicador', label: 'Desvio — Multiplicador', type: 'decimal', defaultValue: 10.0 },
      { key: 'candles_mesmo_sentido', label: 'Candles no Mesmo Sentido', type: 'number', positiveInteger: true, hint: 'Informe um número positivo' },
    ],
  },

  // 13 — Detector de Topos e Fundos
  {
    id: 'detector_top_fundos',
    name: 'Detector de Topos e Fundos',
    formaDeUsoOptions: [
      { value: 'mudanca_no_sinal', label: 'Mudança no sinal' },
      { value: 'sentido_do_topos_fundos', label: 'Sentido do Topos e Fundos' },
    ],
    specificFields: [
      {
        key: 'numero_periodos',
        label: 'Número de períodos',
        type: 'button-group',
        options: [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
        defaultValue: '1',
      },
    ],
  },

  // 14 — Pontos Pivot
  {
    id: 'pontos_pivot',
    name: 'Pontos Pivot',
    formaDeUsoOptions: [],  // No forma_uso for Pontos Pivot (PRD §12.4)
    specificFields: [
      { key: 'dx_distancia_entrada', label: 'DX — Distância para entrada', type: 'decimal', defaultValue: 100.0 },
      { key: 'utilizar_suporte1', label: 'Utilizar Suporte 1', type: 'toggle', defaultValue: false },
      { key: 'utilizar_suporte2', label: 'Utilizar Suporte 2', type: 'toggle', defaultValue: false },
      { key: 'utilizar_resistencia1', label: 'Utilizar Resistência 1', type: 'toggle', defaultValue: false },
      { key: 'utilizar_resistencia2', label: 'Utilizar Resistência 2', type: 'toggle', defaultValue: false },
      { key: 'habilitar_contra_tendencia', label: 'Habilitar Contra Tendência', type: 'toggle', defaultValue: false },
    ],
  },
]
