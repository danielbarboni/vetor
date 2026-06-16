/**
 * OrderList — Paginated, filtered order table for the Sumário screen (SUM-04).
 *
 * Prototype region: order list grid in the Sumário/backtest report modal.
 * Columns: #, DATA, CONTRATO, TIPO, CLASSE, QTD, PREÇO, PREÇO EXEC, STATUS, RESULTADO, ⓘ
 * Filters: status (all/pending/filled/cancelled/rejected) + period (HOJE/7D/30D/TUDO)
 * Actions: "EXPORTAR CSV" triggers client-side Blob download; ⓘ opens OrderEventModal.
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRobotOrders } from '@/lib/api'
import type { OrderRow, SumarioPeriod } from '@/lib/api'
import { downloadOrdersCsv } from './csv'
import OrderEventModal from './OrderEventModal'

interface OrderListProps {
  robotId: string
  period: SumarioPeriod
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  filled: 'Executada',
  cancelled: 'Cancelada',
  rejected: 'Rejeitada',
  queued: 'Na fila',
  sent: 'Enviada',
  confirmed: 'Confirmada',
  expired: 'Expirada',
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  filled: { color: 'var(--color-profit)', bg: 'var(--tint-profit)' },
  cancelled: { color: 'var(--muted)', bg: 'var(--surface3)' },
  rejected: { color: 'var(--color-loss)', bg: 'var(--tint-loss)' },
  pending: { color: 'var(--color-info)', bg: 'var(--tint-info, rgba(111,183,255,0.15))' },
  queued: { color: 'var(--muted2)', bg: 'var(--surface2)' },
  sent: { color: 'var(--color-info)', bg: 'var(--tint-info, rgba(111,183,255,0.15))' },
  confirmed: { color: 'var(--color-primary)', bg: 'var(--tint-primary)' },
  expired: { color: 'var(--muted2)', bg: 'var(--surface2)' },
}

const SIDE_LABELS: Record<string, string> = {
  buy: 'Compra',
  sell: 'Venda',
}

const CLASS_LABELS: Record<string, string> = {
  entry: 'Entrada',
  exit: 'Saída',
  stop: 'Stop',
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  } catch {
    return iso
  }
}

function fmtBrl(val: number | null | undefined): string {
  if (val == null) return '—'
  const sign = val < 0 ? '-' : val > 0 ? '+' : ''
  return `${sign}R$ ${Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPrice(val: number | null | undefined): string {
  if (val == null) return '—'
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 0 })
}

const thStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.08em',
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

const STATUS_FILTERS = ['TODAS', 'filled', 'pending', 'cancelled', 'rejected']

export default function OrderList({ robotId, period }: OrderListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('TODAS')
  const [page, setPage] = useState(1)
  const [eventModal, setEventModal] = useState<string | null>(null) // orderId

  const PAGE_SIZE = 50

  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders', robotId, statusFilter, period, page],
    queryFn: () =>
      getRobotOrders(robotId, {
        status: statusFilter === 'TODAS' ? undefined : statusFilter,
        period,
        page,
        page_size: PAGE_SIZE,
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const orders: OrderRow[] = data?.orders ?? []
  const hasMore = orders.length === PAGE_SIZE

  function handleExportCsv() {
    downloadOrdersCsv(orders, `ordens-${robotId}.csv`)
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--text)', marginRight: 4 }}>Ordens</span>

        {/* Status filter chips */}
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {STATUS_FILTERS.map((s) => {
            const active = s === statusFilter
            return (
              <button
                key={s}
                type="button"
                onClick={() => { setStatusFilter(s); setPage(1) }}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  padding: '5px 10px',
                  borderRadius: 99,
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'var(--surface3)' : 'transparent',
                  color: active ? 'var(--text)' : 'var(--muted2)',
                }}
              >
                {s === 'TODAS' ? 'TODAS' : STATUS_LABELS[s] ?? s}
              </button>
            )
          })}
        </div>

        {/* Export */}
        <button
          type="button"
          onClick={handleExportCsv}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.07em',
            padding: '7px 14px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface2)',
            color: 'var(--muted)',
            cursor: 'pointer',
          }}
        >
          EXPORTAR CSV
        </button>
      </div>

      {/* Table */}
      {isLoading && (
        <div style={{ padding: 24, color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontSize: 13, textAlign: 'center' }}>
          Carregando ordens…
        </div>
      )}

      {isError && (
        <div style={{ padding: 24, color: 'var(--color-loss)', fontFamily: 'Inter, sans-serif', fontSize: 13, textAlign: 'center' }}>
          Erro ao carregar ordens.
        </div>
      )}

      {!isLoading && !isError && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Data</th>
                <th style={thStyle}>Contrato</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Classe</th>
                <th style={thStyle}>Qtd</th>
                <th style={thStyle}>Preço</th>
                <th style={thStyle}>Preço Exec</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Resultado</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ ...tdStyle, textAlign: 'center', color: 'var(--muted2)', padding: 24 }}>
                    Nenhuma ordem encontrada.
                  </td>
                </tr>
              )}
              {orders.map((order, idx) => {
                const statusStyle = STATUS_COLORS[order.status] ?? { color: 'var(--muted)', bg: 'var(--surface2)' }
                const resultColor = (order.result ?? 0) >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'
                const sideLabel = SIDE_LABELS[order.side ?? order.type ?? ''] ?? (order.side ?? order.type ?? '—')
                const classLabel = CLASS_LABELS[order.order_class ?? ''] ?? (order.order_class ?? '—')

                return (
                  <tr key={order.id ?? idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.08)' }}>
                    <td style={{ ...tdStyle, color: 'var(--muted2)', fontSize: 11 }}>
                      #{order.id?.slice(0, 6) ?? idx + 1}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--muted)', fontSize: 11 }}>
                      {fmtDate(order.created_at)}
                    </td>
                    <td style={tdStyle}>{order.effective_contract ?? '—'}</td>
                    <td style={tdStyle}>{sideLabel}</td>
                    <td style={tdStyle}>{classLabel}</td>
                    <td style={tdStyle}>{order.qty ?? '—'}</td>
                    <td style={tdStyle}>{fmtPrice(order.price)}</td>
                    <td style={tdStyle}>{fmtPrice(order.filled_price)}</td>
                    <td style={tdStyle}>
                      <span style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 8.5,
                        fontWeight: 700,
                        letterSpacing: '0.07em',
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        textTransform: 'uppercase',
                      }}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: resultColor, fontWeight: 600 }}>
                      {fmtBrl(order.result ?? null)}
                    </td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        title="Ver eventos da ordem"
                        onClick={() => setEventModal(order.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--muted2)', fontSize: 13, padding: '2px 6px',
                          borderRadius: 6,
                        }}
                        aria-label="Eventos da ordem"
                      >
                        ⓘ
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: page <= 1 ? 'var(--muted2)' : 'var(--text)', cursor: page <= 1 ? 'default' : 'pointer' }}
          >
            ← Anterior
          </button>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--muted2)', alignSelf: 'center' }}>
            Pág. {page}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: !hasMore ? 'var(--muted2)' : 'var(--text)', cursor: !hasMore ? 'default' : 'pointer' }}
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Order Event Modal */}
      {eventModal && (
        <OrderEventModal
          robotId={robotId}
          orderId={eventModal}
          onClose={() => setEventModal(null)}
        />
      )}
    </div>
  )
}
