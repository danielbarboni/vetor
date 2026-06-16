/**
 * BacktestReport — Route /backtests/:id (BCK-04).
 *
 * Prototype source: <sc-if value="{{ showBtReport }}"> region
 * (lines 3687–3765 of Plataforma Vetor v3.dc.html). Pixel-faithful port.
 *
 * BCK-04 parity: REUSES the Sumário MetricCards + EquityChart + OrderList
 * components so metrics render identically to the live Sumário screen.
 *
 * For completed backtests, feeds:
 *   - MetricCards with a SumarioResponse-shaped object derived from backtest.result
 *   - EquityChart with backtest.result.equity_series
 *   - OrderList (read-only) via getBacktestOrders
 */

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBacktest, getBacktestOrders } from '@/lib/api'
import type { SumarioMetrics, RelatorioCompleto as RelatorioCompletoType, BacktestOrderRow } from '@/lib/api'
import EquityChart from '@/components/charts/EquityChart'
import RelatorioCompleto from '@/components/sumario/RelatorioCompleto'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`
  } catch { return iso }
}

function fmtBrl(val: number | null | undefined): string {
  if (val == null) return '—'
  const sign = val < 0 ? '-' : val > 0 ? '+' : ''
  return `${sign}R$ ${Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtNum(val: number | null | undefined): string {
  if (val == null) return '—'
  return val.toLocaleString('pt-BR')
}

function fmtPct(val: number | null | undefined): string {
  if (val == null) return '—'
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`
}

const FILL_LABELS: Record<string, string> = {
  pessimista: 'Conservador',
  moderado:   'Moderado',
  otimista:   'Otimista',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  aguardando:  { label: 'Aguardando',  color: 'var(--muted2)',      bg: 'var(--surface3)' },
  processando: { label: 'Processando', color: 'var(--color-amber)', bg: 'var(--tint-amber)' },
  concluido:   { label: 'Concluído',   color: 'var(--color-info)',  bg: 'var(--tint-info)' },
  erro:        { label: 'Erro',        color: 'var(--color-loss)',  bg: 'var(--tint-loss)' },
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '13px 14px',
}

const metricLabelStyle: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 700,
  letterSpacing: '.06em',
  color: 'var(--muted2)',
}

const metricValueLgStyle: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontWeight: 700,
  fontSize: 17,
  marginTop: 6,
  whiteSpace: 'nowrap' as const,
}

const metricValueMdStyle: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontWeight: 600,
  fontSize: 15,
  marginTop: 7,
}

// ── BacktestOrderList ─────────────────────────────────────────────────────────
// Read-only order list for backtest report (no events modal, no filter chips needed)

const STATUS_LABELS: Record<string, string> = {
  filled:    'Executada',
  cancelled: 'Cancelada',
  rejected:  'Rejeitada',
  pending:   'Pendente',
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  filled:    { color: 'var(--color-profit)', bg: 'var(--tint-profit)' },
  cancelled: { color: 'var(--muted)',        bg: 'var(--surface3)' },
  rejected:  { color: 'var(--color-loss)',   bg: 'var(--tint-loss)' },
  pending:   { color: 'var(--color-info)',   bg: 'var(--tint-info, rgba(111,183,255,0.15))' },
}

const CLASS_LABELS: Record<string, string> = { entry: 'Entrada', exit: 'Saída', stop: 'Stop' }
const SIDE_LABELS: Record<string, string> = { buy: 'Compra', sell: 'Venda' }

const thStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '.08em',
  color: 'var(--muted2)',
  textTransform: 'uppercase',
  padding: '10px 8px',
  textAlign: 'left' as const,
  whiteSpace: 'nowrap' as const,
  borderBottom: '1px solid var(--border)',
}

const tdStyle: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12,
  fontWeight: 400,
  color: 'var(--text)',
  padding: '8px',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap' as const,
}

function BacktestOrderList({ orders }: { orders: BacktestOrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div style={{ padding: '24px', color: 'var(--muted2)', fontFamily: 'Inter, sans-serif', fontSize: 13, textAlign: 'center' }}>
        Nenhuma ordem simulada.
      </div>
    )
  }
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
          Ordens simuladas
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Data</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Classe</th>
              <th style={thStyle}>Preço</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: 'right' as const }}>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, idx) => {
              const sc = STATUS_COLORS[o.status] ?? { color: 'var(--muted)', bg: 'var(--surface2)' }
              const resultColor = (o.result ?? 0) >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'
              return (
                <tr key={o.id ?? idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.08)' }}>
                  <td style={{ ...tdStyle, color: 'var(--muted2)', fontSize: 11 }}>#{idx + 1}</td>
                  <td style={{ ...tdStyle, color: 'var(--muted)', fontSize: 11 }}>
                    {o.filled_at ? o.filled_at.slice(0, 10) : '—'}
                  </td>
                  <td style={tdStyle}>{SIDE_LABELS[o.type] ?? o.type}</td>
                  <td style={tdStyle}>{CLASS_LABELS[o.order_class] ?? o.order_class}</td>
                  <td style={tdStyle}>{o.filled_price != null ? o.filled_price.toLocaleString('pt-BR') : '—'}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontFamily: 'Inter, sans-serif', fontSize: 8.5, fontWeight: 700,
                      letterSpacing: '.07em', padding: '2px 8px', borderRadius: 99,
                      background: sc.bg, color: sc.color, textTransform: 'uppercase' as const,
                    }}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const, color: resultColor, fontWeight: 600 }}>
                    {fmtBrl(o.result)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BacktestReport() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showFull, setShowFull] = useState(false)

  const { data: backtest, isLoading, isError } = useQuery({
    queryKey: ['backtest', id],
    queryFn: () => getBacktest(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'aguardando' || status === 'processando' ? 3000 : false
    },
  })

  const { data: ordersData } = useQuery({
    queryKey: ['backtest-orders', id],
    queryFn: () => getBacktestOrders(id!),
    enabled: !!id && backtest?.status === 'concluido',
    staleTime: 60_000,
  })

  const orders: BacktestOrderRow[] = ordersData?.orders ?? []

  if (isLoading) {
    return (
      <div style={{ padding: '40px 28px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
        Carregando backtest…
      </div>
    )
  }

  if (isError || !backtest) {
    return (
      <div style={{ padding: '40px 28px', color: 'var(--color-loss)', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
        Backtest não encontrado ou erro ao carregar.
      </div>
    )
  }

  const result = backtest.result as (SumarioMetrics & { equity_series?: Array<[number, number]> }) | null
  const statusCfg = STATUS_CONFIG[backtest.status] ?? STATUS_CONFIG.aguardando

  // Equity series from result
  const equitySeries: Array<[number, number]> = result?.equity_series ?? []

  // Extract relatorio for RelatorioCompleto component (BCK-04 parity)
  const relatorio = result?.relatorio ?? null

  return (
    <div style={{ padding: '22px 28px 80px', animation: 'fadeUp .25s ease' }}>

      {/* Breadcrumb / back nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <span
          onClick={() => navigate('/backtests')}
          style={{ fontSize: 12, color: 'var(--muted2)', cursor: 'pointer' }}
        >
          ← Backtests
        </span>
      </div>

      {/* Header — prototype lines 3690-3701 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 22 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17 }}>
              Backtest — {fmtDate(backtest.date_from)} a {fmtDate(backtest.date_to)}
            </span>
            <span style={{
              fontSize: 8.5, fontWeight: 700, letterSpacing: '.09em',
              padding: '3px 8px', borderRadius: 99,
              background: statusCfg.bg, color: statusCfg.color,
            }}>
              {statusCfg.label.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>
            {FILL_LABELS[backtest.fill_policy] ?? backtest.fill_policy}
            {' · capital: '}
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              R$ {backtest.capital.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {' · backtest '}
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{backtest.id.slice(0, 8)}</span>
          </div>
        </div>
      </div>

      {/* In progress / waiting */}
      {(backtest.status === 'aguardando' || backtest.status === 'processando') && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16, padding: 24,
          display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 7, height: 7, borderRadius: 99,
              background: 'var(--color-amber)', animation: 'pulseDot 2s infinite',
            }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {backtest.status === 'aguardando' ? 'Na fila de processamento…' : 'Processando backtest…'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            O relatório ficará disponível assim que o backtest for concluído.
            Esta página atualiza automaticamente.
          </div>
        </div>
      )}

      {/* Error */}
      {backtest.status === 'erro' && (
        <div style={{
          background: 'var(--tint-loss)',
          border: '1px solid var(--color-loss)',
          borderRadius: 16, padding: 20, maxWidth: 600,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-loss)', marginBottom: 6 }}>
            Erro na execução do backtest
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {backtest.error || 'Ocorreu um erro inesperado durante a execução.'}
          </div>
        </div>
      )}

      {/* Completed report — prototype lines 3703-3765 */}
      {backtest.status === 'concluido' && result && (
        <>
          {/* Equity chart — prototype lines 3704-3714 */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: 'var(--muted2)', marginBottom: 10 }}>
              EVOLUÇÃO DO PATRIMÔNIO SIMULADO
            </div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
              <EquityChart
                data={equitySeries}
                baseline={backtest.capital}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted2)', fontFamily: 'JetBrains Mono, monospace', marginTop: 8 }}>
                <span>{fmtDate(backtest.date_from)} – {fmtDate(backtest.date_to)}</span>
                <span>capital de simulação: R$ {backtest.capital.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Summary metric cards — prototype lines 3715-3725 — BCK-04 parity */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: 'var(--muted2)', margin: '20px 0 10px' }}>
              RESUMO
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <div style={cardStyle}>
                <div style={metricLabelStyle}>RETORNO LÍQUIDO</div>
                <div style={{
                  ...metricValueLgStyle,
                  color: (result.net_return ?? 0) >= 0 ? 'var(--color-profit)' : 'var(--color-loss)',
                }}>
                  {fmtBrl(result.net_return)}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={metricLabelStyle}>PATRIMÔNIO</div>
                <div style={{ ...metricValueLgStyle }}>
                  {fmtBrl(result.patrimonio)}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={metricLabelStyle}>DRAWDOWN MÁXIMO</div>
                <div style={{ ...metricValueMdStyle, color: 'var(--color-loss)' }}>
                  {fmtBrl(result.max_drawdown?.abs)}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={metricLabelStyle}>FATOR DE LUCRO</div>
                <div style={metricValueMdStyle}>
                  {result.profit_factor != null ? result.profit_factor.toFixed(2) : '∞'}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={metricLabelStyle}>Nº DE TRADES</div>
                <div style={metricValueMdStyle}>{fmtNum(result.number_of_trades)}</div>
              </div>

              <div style={cardStyle}>
                <div style={metricLabelStyle}>TRADES COM LUCRO</div>
                <div style={metricValueMdStyle}>{fmtPct(result.profitable_pct)}</div>
              </div>

              <div style={cardStyle}>
                <div style={metricLabelStyle}>SALDO DIÁRIO</div>
                <div style={{ ...metricValueMdStyle, color: 'var(--muted)' }}>
                  {fmtBrl(result.daily_balance)}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={metricLabelStyle}>ATIVO</div>
                <div style={metricValueMdStyle}>BACKTEST</div>
              </div>
            </div>
          </div>

          {/* RELATÓRIO COMPLETO toggle — prototype lines 3727-3765 (BCK-04 parity) */}
          {relatorio && (
            <div style={{ marginTop: 18 }}>
              <div
                onClick={() => setShowFull((v) => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: 'var(--color-primary)' }}>
                  RELATÓRIO COMPLETO
                </span>
                <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ color: 'var(--color-primary)', display: 'inline-flex', transform: showFull ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9.5l6 6 6-6" />
                  </svg>
                </span>
              </div>
              {showFull && (
                <div style={{ marginTop: 14 }}>
                  <RelatorioCompleto relatorio={relatorio as RelatorioCompletoType} />
                </div>
              )}
            </div>
          )}

          {/* Simulated orders (reuses OrderList style) */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: 'var(--muted2)', marginBottom: 10 }}>
              ORDENS SIMULADAS
            </div>
            <BacktestOrderList orders={orders} />
          </div>
        </>
      )}
    </div>
  )
}
