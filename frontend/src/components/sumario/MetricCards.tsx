/**
 * MetricCards — Primary metric card grid for the Sumário screen (SUM-02).
 *
 * Prototype region: editor SUMÁRIO tab metric-card grid (12-col layout).
 * Cards: RETORNO LÍQUIDO, PATRIMÔNIO, COTAÇÃO·[contract] (live WS tick),
 *        POSIÇÃO ATUAL, EquityChart card, and secondary right-column metrics
 *        (Drawdown máximo, Número de trades, Trades com lucro, Fator de lucro, Saldo diário).
 *
 * Live quote updates from the ticks store (D-01 WS).
 */

import EquityChart from '@/components/charts/EquityChart'
import type { SumarioResponse } from '@/lib/api'
import { useTickStore } from '@/stores/ticks'

interface MetricCardsProps {
  sumario: SumarioResponse
  equitySeries: Array<[number, number]>
  robotId: string
}

function fmtBrl(val: number | null | undefined, decSep = ','): string {
  if (val == null) return '—'
  const abs = Math.abs(val)
  const formatted = abs.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const sign = val < 0 ? '-' : val > 0 ? '+' : ''
  return `${sign}R$ ${decSep === '.' ? formatted.replace(',', '.') : formatted}`
}

function fmtPct(val: number | null | undefined): string {
  if (val == null) return '—'
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`
}

function fmtNum(val: number | null | undefined): string {
  if (val == null) return '—'
  return val.toLocaleString('pt-BR')
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 18,
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: 'var(--muted2)',
  textTransform: 'uppercase' as const,
  marginBottom: 6,
}

const valueMonoLg: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 24,
  fontWeight: 600,
  whiteSpace: 'nowrap' as const,
}

const valueMonoMd: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 15,
  fontWeight: 600,
}

const hintStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  fontWeight: 400,
  color: 'var(--muted2)',
  marginTop: 4,
}

export default function MetricCards({ sumario, equitySeries, robotId }: MetricCardsProps) {
  const tick = useTickStore((s) => s.ticks[robotId])

  const netReturn = sumario.net_return ?? 0
  const netColor = netReturn >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'

  const patrimonio = sumario.patrimonio ?? 0
  const patrimonioColor = patrimonio >= (sumario.simulation_capital ?? 0)
    ? 'var(--color-profit)'
    : 'var(--color-loss)'

  const ddAbs = sumario.max_drawdown?.abs ?? 0
  const ddPct = sumario.max_drawdown?.pct ?? 0
  const pf = sumario.profit_factor
  const profitable = sumario.profitable_pct
  const nTrades = sumario.number_of_trades ?? 0
  const daily = sumario.daily_balance ?? 0
  const dailyColor = daily >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'

  const contract = sumario.effective_contract ?? sumario.asset ?? '—'
  const quotePrice = tick?.price ?? null
  const quoteChange = tick?.change ?? null
  const quoteChangeColor = (quoteChange ?? 0) >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'

  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      {/* Left column: primary metric cards (4-wide grid on large screens) */}
      <div style={{ flex: '1 1 600px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>

        {/* RETORNO LÍQUIDO */}
        <div style={cardStyle}>
          <div style={labelStyle}>Retorno Líquido</div>
          <div style={{ ...valueMonoLg, color: netColor }}>{fmtBrl(netReturn)}</div>
          <div style={hintStyle}>Total acumulado no período</div>
        </div>

        {/* PATRIMÔNIO */}
        <div style={cardStyle}>
          <div style={labelStyle}>Patrimônio</div>
          <div style={{ ...valueMonoLg, color: patrimonioColor }}>{fmtBrl(patrimonio)}</div>
          <div style={hintStyle}>Capital + resultado líquido</div>
        </div>

        {/* COTAÇÃO · [contract] (live WS tick) */}
        <div style={cardStyle}>
          <div style={labelStyle}>Cotação · {contract}</div>
          <div style={{ ...valueMonoLg, color: 'var(--text)' }}>
            {quotePrice != null
              ? quotePrice.toLocaleString('pt-BR', { minimumFractionDigits: 0 })
              : '—'}
          </div>
          {quoteChange != null && (
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, fontWeight: 600, color: quoteChangeColor, marginTop: 4 }}>
              {quoteChange >= 0 ? '+' : ''}{quoteChange.toFixed(2)} pts
            </div>
          )}
          {!tick && (
            <div style={hintStyle}>Aguardando cotação ao vivo…</div>
          )}
        </div>

        {/* POSIÇÃO ATUAL */}
        <div style={cardStyle}>
          <div style={labelStyle}>Posição Atual</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
            Sem posição
          </div>
          <div style={hintStyle}>Sem contrato aberto</div>
        </div>

        {/* EQUITY CHART — spans full width */}
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <div style={labelStyle}>Evolução do Patrimônio</div>
          <EquityChart
            data={equitySeries}
            baseline={sumario.simulation_capital ?? undefined}
          />
        </div>
      </div>

      {/* Right column: secondary metrics */}
      <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        <div style={{ ...cardStyle, padding: '14px 16px' }}>
          <div style={labelStyle}>Drawdown Máximo</div>
          <div style={{ ...valueMonoMd, color: ddAbs > 0 ? 'var(--color-loss)' : 'var(--muted)' }}>
            {fmtBrl(ddAbs)}
          </div>
          <div style={hintStyle}>{fmtPct(ddPct)}</div>
        </div>

        <div style={{ ...cardStyle, padding: '14px 16px' }}>
          <div style={labelStyle}>Número de Trades</div>
          <div style={{ ...valueMonoMd, color: 'var(--text)' }}>{fmtNum(nTrades)}</div>
        </div>

        <div style={{ ...cardStyle, padding: '14px 16px' }}>
          <div style={labelStyle}>Trades com Lucro</div>
          <div style={{ ...valueMonoMd, color: 'var(--color-profit)' }}>{fmtPct(profitable)}</div>
        </div>

        <div style={{ ...cardStyle, padding: '14px 16px' }}>
          <div style={labelStyle}>Fator de Lucro</div>
          <div style={{ ...valueMonoMd, color: 'var(--text)' }}>
            {pf != null ? pf.toFixed(2) : '∞'}
          </div>
        </div>

        <div style={{ ...cardStyle, padding: '14px 16px' }}>
          <div style={labelStyle}>Saldo Diário</div>
          <div style={{ ...valueMonoMd, color: dailyColor }}>{fmtBrl(daily)}</div>
        </div>
      </div>
    </div>
  )
}
