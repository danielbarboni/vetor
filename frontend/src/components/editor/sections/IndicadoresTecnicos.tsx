/**
 * IndicadoresTecnicos — Section 03 of the editor (PRD §12.5).
 *
 * Renders:
 *   1. General entry params (§12.3): modo_operacao_global, tipo_envio_ordem + conditionals,
 *      entrada_por_indicadores
 *   2. All 14 indicator rows in PRD §12.4 order
 *
 * Props:
 *   params    — the current IT params dict (robot.params)
 *   onChange  — callback for any field change; receives updated params
 *   locked    — execution lock (robot.status === 'executando')
 */
import React from 'react'
import IndicadorRow from '@/components/editor/IndicadorRow'
import { INDICATOR_DEFS } from '@/data/indicatorDefs'

interface Props {
  params: Record<string, unknown>
  onChange: (params: Record<string, unknown>) => void
  locked: boolean
}

function ParamRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '250px 1fr',
      gap: '14px',
      alignItems: 'center',
      padding: '13px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>{label}</div>
        {hint && <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

const selectStyle = (locked: boolean): React.CSSProperties => ({
  background: locked ? 'var(--surface3)' : 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '10px 13px',
  color: locked ? 'var(--muted)' : 'var(--color-text-hi)',
  fontSize: '13px',
  width: '100%',
  fontFamily: 'Inter, sans-serif',
  cursor: locked ? 'not-allowed' : 'pointer',
  boxSizing: 'border-box',
})

const inputStyle = (locked: boolean): React.CSSProperties => ({
  background: locked ? 'var(--surface3)' : 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '10px 13px',
  color: locked ? 'var(--muted)' : 'var(--color-text-hi)',
  fontSize: '13px',
  width: '100%',
  fontFamily: 'JetBrains Mono, monospace',
  boxSizing: 'border-box',
})

export default function IndicadoresTecnicos({ params, onChange, locked }: Props) {
  function setParam(key: string, value: unknown) {
    onChange({ ...params, [key]: value })
  }

  function setIndicatorField(indicatorId: string, fieldKey: string, value: unknown) {
    const current = (params[indicatorId] as Record<string, unknown>) ?? {}
    onChange({ ...params, [indicatorId]: { ...current, [fieldKey]: value } })
  }

  const tipoEnvio = String(params.tipo_envio_ordem ?? 'a_mercado')
  const isLimite = tipoEnvio === 'limite'

  return (
    <div>
      {/* ── §12.3 General entry params ──────────────────────────────────── */}
      <div style={{
        marginBottom: '20px',
        paddingBottom: '8px',
        borderBottom: '2px solid var(--border)',
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--muted2)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '8px',
          fontFamily: 'Inter, sans-serif',
        }}>
          Parâmetros gerais de entrada
        </div>

        <ParamRow label="Modo de operação global">
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['candle_aberto', 'candle_fechado'] as const).map((v) => (
              <button
                key={v}
                onClick={() => !locked && setParam('modo_operacao_global', v)}
                disabled={locked}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: params.modo_operacao_global === v ? 'var(--color-primary)' : 'var(--surface2)',
                  color: params.modo_operacao_global === v ? 'var(--color-on-primary)' : 'var(--muted)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {v === 'candle_aberto' ? 'CANDLE ABERTO' : 'CANDLE FECHADO'}
              </button>
            ))}
          </div>
        </ParamRow>

        <ParamRow label="Tipo do envio de ordem de entrada">
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['a_mercado', 'limite'] as const).map((v) => (
              <button
                key={v}
                onClick={() => !locked && setParam('tipo_envio_ordem', v)}
                disabled={locked}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: tipoEnvio === v ? 'var(--color-primary)' : 'var(--surface2)',
                  color: tipoEnvio === v ? 'var(--color-on-primary)' : 'var(--muted)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {v === 'a_mercado' ? 'A MERCADO' : 'LIMITE'}
              </button>
            ))}
          </div>
        </ParamRow>

        {/* Conditionals revealed when LIMITE */}
        {isLimite && (
          <>
            <ParamRow label="Sentido do Spread">
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['a_favor', 'contra'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => !locked && setParam('sentido_spread', v)}
                    disabled={locked}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: params.sentido_spread === v ? 'var(--color-primary)' : 'var(--surface2)',
                      color: params.sentido_spread === v ? 'var(--color-on-primary)' : 'var(--muted)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      cursor: locked ? 'not-allowed' : 'pointer',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {v === 'a_favor' ? 'A FAVOR' : 'CONTRA'}
                  </button>
                ))}
              </div>
            </ParamRow>
            <ParamRow label="Spread para executar a ordem limite">
              <input
                type="number"
                step="0.01"
                value={String(params.spread_valor ?? 0.15)}
                onChange={(e) => setParam('spread_valor', parseFloat(e.target.value))}
                disabled={locked}
                style={inputStyle(locked)}
              />
            </ParamRow>
            <ParamRow label="Tempo para execução limite (s)">
              <input
                type="number"
                value={String(params.tempo_execucao_limite ?? 60)}
                onChange={(e) => setParam('tempo_execucao_limite', parseInt(e.target.value))}
                disabled={locked}
                style={inputStyle(locked)}
              />
            </ParamRow>
            <ParamRow label="Operação na expiração do limite">
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['executar_a_mercado', 'cancelar'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => !locked && setParam('operacao_na_expiracao', v)}
                    disabled={locked}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: params.operacao_na_expiracao === v ? 'var(--color-primary)' : 'var(--surface2)',
                      color: params.operacao_na_expiracao === v ? 'var(--color-on-primary)' : 'var(--muted)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      cursor: locked ? 'not-allowed' : 'pointer',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {v === 'executar_a_mercado' ? 'EXECUTAR A MERCADO' : 'CANCELAR'}
                  </button>
                ))}
              </div>
            </ParamRow>
          </>
        )}

        <ParamRow label="Entrada por indicadores">
          <select
            value={String(params.entrada_por_indicadores ?? 'todos')}
            onChange={(e) => setParam('entrada_por_indicadores', e.target.value)}
            disabled={locked}
            style={selectStyle(locked)}
          >
            <option value="todos">Entrar se todos os indicadores selecionados para entradas sinalizarem</option>
            <option value="pelo_menos_um">Entrar se pelo menos um indicador sinalizar</option>
          </select>
        </ParamRow>
      </div>

      {/* ── §12.4 All 14 indicators ─────────────────────────────────────── */}
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--muted2)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '12px',
        fontFamily: 'Inter, sans-serif',
      }}>
        Indicadores ({INDICATOR_DEFS.length})
      </div>

      {INDICATOR_DEFS.map((def) => {
        const indicatorValues = (params[def.id] as Record<string, unknown>) ?? { habilitado: false }
        return (
          <IndicadorRow
            key={def.id}
            def={def}
            values={indicatorValues}
            onChange={(fieldKey, value) => setIndicatorField(def.id, fieldKey, value)}
            locked={locked}
          />
        )
      })}
    </div>
  )
}
