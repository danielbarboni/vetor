/**
 * BacktestModal — "Criar backtest" modal (BCK-01, BCK-02).
 *
 * Prototype source: data-screen="backtests" → <sc-if value="{{ showBT }}"> region
 * (lines 4093–4150 of Plataforma Vetor v3.dc.html). Pixel-faithful port.
 *
 * Features:
 *  - Nome do backtest (pre-filled with robot name)
 *  - Capital para simulação input (R$ 1.000,00 default)
 *  - Custos operacionais select (Custo Padrão / Perfil XCap / Sem custos)
 *  - Tipo do backtest select (Cenário Pessimista / Moderado / Otimista — fill_policy)
 *  - Período: start/end date inputs + shortcut chips (1 MÊS/3 MESES/6 MESES/1 ANO/2 ANOS)
 *  - "DISPONÍVEIS" credits counter pill in header (BCK-02)
 *  - "INICIAR BACKTEST" CTA → createBacktest (BCK-01)
 *  - "Consome 1 crédito por execução" hint
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCredits, createBacktest } from '@/lib/api'
import type { BacktestCreatePayload } from '@/lib/api'

interface BacktestModalProps {
  robotId: string
  robotName: string
  onClose: () => void
  onCreated?: () => void
}

type FillPolicy = 'pessimista' | 'moderado' | 'otimista'
type PeriodShortcut = 'm1' | 'm3' | 'm6' | 'a1' | 'a2'

const PERIOD_SHORTCUTS: { key: PeriodShortcut; label: string; months: number }[] = [
  { key: 'm1', label: '1 MÊS',   months: 1  },
  { key: 'm3', label: '3 MESES', months: 3  },
  { key: 'm6', label: '6 MESES', months: 6  },
  { key: 'a1', label: '1 ANO',   months: 12 },
  { key: 'a2', label: '2 ANOS',  months: 24 },
]

const FILL_POLICY_OPTIONS: { value: FillPolicy; label: string }[] = [
  { value: 'moderado',   label: 'Cenário moderado'     },
  { value: 'pessimista', label: 'Cenário conservador'  },
  { value: 'otimista',   label: 'Cenário otimista'     },
]

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export default function BacktestModal({ robotId, robotName, onClose, onCreated }: BacktestModalProps) {
  const queryClient = useQueryClient()

  const today = new Date()
  const [name, setName] = useState(robotName)
  const [capital, setCapital] = useState('1000')
  const [includeCosts, setIncludeCosts] = useState(true)
  const [fillPolicy, setFillPolicy] = useState<FillPolicy>('moderado')
  const [dateFrom, setDateFrom] = useState(isoDate(addMonths(today, -12)))
  const [dateTo, setDateTo] = useState(isoDate(today))
  const [activePeriod, setActivePeriod] = useState<PeriodShortcut | null>('a1')
  const [error, setError] = useState<string | null>(null)

  // BCK-02: fetch credits
  const { data: creditsData } = useQuery({
    queryKey: ['credits'],
    queryFn: getCredits,
    staleTime: 30_000,
  })
  const credits = creditsData?.balance ?? 0

  function applyShortcut(key: PeriodShortcut) {
    const sc = PERIOD_SHORTCUTS.find((p) => p.key === key)
    if (!sc) return
    const end = new Date()
    const start = addMonths(end, -sc.months)
    setDateFrom(isoDate(start))
    setDateTo(isoDate(end))
    setActivePeriod(key)
  }

  function handleDateChange(field: 'from' | 'to', val: string) {
    if (field === 'from') setDateFrom(val)
    else setDateTo(val)
    setActivePeriod(null) // deselect shortcut when manually changed
  }

  const mutation = useMutation({
    mutationFn: (payload: BacktestCreatePayload) => createBacktest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtests'] })
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      onCreated?.()
      onClose()
    },
    onError: (err: Error) => {
      setError(err.message || 'Erro ao criar backtest.')
    },
  })

  function handleSubmit() {
    setError(null)
    const cap = parseFloat(capital.replace(',', '.'))
    if (isNaN(cap) || cap <= 0) {
      setError('Capital deve ser um valor positivo.')
      return
    }
    if (!dateFrom || !dateTo || dateFrom >= dateTo) {
      setError('Período inválido. A data de início deve ser anterior à data de fim.')
      return
    }
    mutation.mutate({
      robot_id: robotId,
      capital: cap,
      fill_policy: fillPolicy,
      date_from: new Date(dateFrom).toISOString(),
      date_to: new Date(dateTo).toISOString(),
      include_costs: includeCosts,
    })
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '10px 13px',
    color: 'var(--text)',
    fontSize: 13,
    width: '100%',
    boxSizing: 'border-box' as const,
    outline: 'none',
    fontFamily: 'inherit',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    fontSize: 12.5,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  return (
    /* Overlay — prototype: rgba(4,7,12,.62) backdrop-filter:blur(6px)
       aria-label="Novo Backtest" (BCK-01 modal identifier) */
    <div
      aria-label="Novo Backtest"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4,7,12,.62)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        animation: 'fadeUp .2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Panel — prototype: width:540px */}
      <div style={{
        width: 540,
        maxHeight: '90vh',
        overflow: 'auto',
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: 18,
        padding: 24,
        boxShadow: 'var(--shadow)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17 }}>
            Criar backtest
          </div>
          <span style={{ flex: 1 }} />

          {/* Credits pill — prototype: border:1px solid var(--border), DISPONÍVEIS label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            border: '1px solid var(--border)',
            borderRadius: 99, padding: '5px 12px',
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', color: 'var(--muted2)' }}>
              DISPONÍVEIS
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 12.5, color: 'var(--color-accent)' }}>
              {credits}
            </span>
          </div>

          {/* Close button */}
          <div
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--muted)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>

          {/* Nome do backtest */}
          <div>
            <div style={labelStyle}>Nome do backtest</div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Capital + Custos */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>
                Capital para simulação
                <span
                  title="Patrimônio inicial do backtest."
                  style={{
                    width: 14, height: 14, borderRadius: 99,
                    border: '1px solid var(--border2)',
                    color: 'var(--muted2)', fontSize: 9,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'help',
                  }}
                >?</span>
              </div>
              <input
                type="text"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace' }}
                placeholder="1000"
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>Custos operacionais</div>
              <select
                value={includeCosts ? 'padrao' : 'sem'}
                onChange={(e) => setIncludeCosts(e.target.value !== 'sem')}
                style={selectStyle}
              >
                <option value="padrao">Custo Padrão</option>
                <option value="xcap">Perfil XCap Day Trade</option>
                <option value="sem">Sem custos</option>
              </select>
            </div>
          </div>

          {/* Tipo do backtest */}
          <div>
            <div style={labelStyle}>
              Tipo do backtest
              <span
                title="Define a política de preenchimento (slippage) do simulador histórico."
                style={{
                  width: 14, height: 14, borderRadius: 99,
                  border: '1px solid var(--border2)',
                  color: 'var(--muted2)', fontSize: 9,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'help',
                }}
              >?</span>
            </div>
            <select
              value={fillPolicy}
              onChange={(e) => setFillPolicy(e.target.value as FillPolicy)}
              style={selectStyle}
            >
              {FILL_POLICY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Período */}
          <div>
            <div style={labelStyle}>Período</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateChange('from', e.target.value)}
                style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, flex: 1 }}
              />
              <span style={{ color: 'var(--muted2)', fontSize: 11 }}>até</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateChange('to', e.target.value)}
                style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, flex: 1 }}
              />
            </div>

            {/* Shortcut chips — prototype .bc/.bc-on classes */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {PERIOD_SHORTCUTS.map((sc) => {
                const active = activePeriod === sc.key
                return (
                  <span
                    key={sc.key}
                    onClick={() => applyShortcut(sc.key)}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '.05em',
                      padding: '5px 11px',
                      borderRadius: 99,
                      cursor: 'pointer',
                      transition: 'all .15s',
                      background: active ? 'var(--tint-primary)' : 'transparent',
                      color: active ? 'var(--color-primary)' : 'var(--muted2)',
                      border: active ? '1px solid var(--color-primary)' : '1px solid var(--border2)',
                    }}
                  >
                    {sc.label}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 14,
            padding: '10px 14px',
            background: 'var(--tint-loss)',
            color: 'var(--color-loss)',
            borderRadius: 10,
            fontSize: 12,
          }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--muted2)' }}>
            Consome 1 crédito por execução
          </div>
          <span style={{ flex: 1 }} />

          <div
            onClick={onClose}
            style={{
              display: 'inline-flex', alignItems: 'center',
              border: '1px solid var(--border2)',
              color: 'var(--muted)',
              borderRadius: 12, padding: '11px 16px',
              fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
              cursor: 'pointer', transition: 'all .15s',
            }}
          >
            CANCELAR
          </div>

          {/* INICIAR BACKTEST CTA — prototype: background:var(--color-primary) */}
          <div
            onClick={mutation.isPending ? undefined : handleSubmit}
            style={{
              display: 'inline-flex', alignItems: 'center',
              background: credits <= 0 ? 'var(--surface3)' : 'var(--color-primary)',
              color: credits <= 0 ? 'var(--muted)' : 'var(--color-on-primary)',
              borderRadius: 12, padding: '11px 18px',
              fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
              cursor: credits <= 0 || mutation.isPending ? 'default' : 'pointer',
              transition: 'transform .15s',
              opacity: mutation.isPending ? 0.7 : 1,
            }}
          >
            {mutation.isPending ? 'CRIANDO…' : 'INICIAR BACKTEST'}
          </div>
        </div>
      </div>
    </div>
  )
}
