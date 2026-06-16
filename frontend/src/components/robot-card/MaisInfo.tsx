/**
 * MaisInfo — expandable accordion panel for robot card (ROB-04).
 *
 * Shows 4 secondary metrics in a flex-wrap grid:
 *   Número de trades | Trades com lucro % | Fator de lucro | Drawdown máximo
 *
 * Ported from prototype sc-if/sc-for pattern (lines 241-250).
 */

interface MaisInfoProps {
  total_trades: number | null
  profitable_pct: number | null
  profit_factor: number | null
  max_drawdown: number | null
}

interface StatCard {
  label: string
  value: string
  color?: string
}

function fmtPct(v: number | null): string {
  if (v === null) return '—'
  return `${v.toFixed(1)}%`
}

function fmtBrl(v: number | null): string {
  if (v === null) return '—'
  return `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function fmtFactor(v: number | null): string {
  if (v === null) return '—'
  return v.toFixed(2)
}

export default function MaisInfo({
  total_trades,
  profitable_pct,
  profit_factor,
  max_drawdown,
}: MaisInfoProps) {
  const stats: StatCard[] = [
    {
      label: 'Número de trades',
      value: total_trades !== null ? String(total_trades) : '—',
    },
    {
      label: 'Trades com lucro',
      value: fmtPct(profitable_pct),
      color:
        profitable_pct !== null
          ? profitable_pct >= 50
            ? 'var(--color-profit)'
            : 'var(--color-loss)'
          : undefined,
    },
    {
      label: 'Fator de lucro',
      value: fmtFactor(profit_factor),
      color:
        profit_factor !== null
          ? profit_factor >= 1
            ? 'var(--color-profit)'
            : 'var(--color-loss)'
          : undefined,
    },
    {
      label: 'Drawdown máximo',
      value: fmtBrl(max_drawdown),
      color: max_drawdown !== null && max_drawdown < 0 ? 'var(--color-loss)' : undefined,
    },
  ]

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {stats.map((m) => (
        <div
          key={m.label}
          style={{
            flex: '1 1 96px',
            minWidth: '96px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--surface2)',
            borderRadius: '10px',
            padding: '8px 10px',
          }}
        >
          <div
            style={{
              fontSize: '8.5px',
              fontWeight: 700,
              letterSpacing: '.05em',
              lineHeight: 1.25,
              color: 'var(--muted2)',
            }}
          >
            {m.label}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12.5px',
              fontWeight: 600,
              marginTop: '5px',
              whiteSpace: 'nowrap',
              color: m.color ?? 'var(--text)',
            }}
          >
            {m.value}
          </div>
        </div>
      ))}
    </div>
  )
}
