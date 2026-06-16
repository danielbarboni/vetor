/**
 * OrderEventModal — Per-order event log modal (SUM-05).
 *
 * Prototype region: order event detail modal (640px wide).
 * Shows the chronological event log for a single order from the events endpoint.
 */

import { useQuery } from '@tanstack/react-query'
import { getOrderEvents } from '@/lib/api'

interface OrderEventModalProps {
  robotId: string
  orderId: string
  onClose: () => void
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  created: 'Criada',
  sent: 'Enviada',
  confirmed: 'Confirmada',
  filled: 'Executada',
  cancelled: 'Cancelada',
  rejected: 'Rejeitada',
  expired: 'Expirada',
  error: 'Erro',
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false })
  } catch {
    return iso
  }
}

export default function OrderEventModal({ robotId, orderId, onClose }: OrderEventModalProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['order-events', robotId, orderId],
    queryFn: () => getOrderEvents(robotId, orderId),
    staleTime: 30_000,
  })

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 100,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 640,
        maxWidth: '90vw',
        maxHeight: '80vh',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        boxShadow: 'var(--shadow)',
        zIndex: 101,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Eventos da Ordem
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: 'var(--muted2)', marginTop: 2 }}>
              #{orderId.slice(0, 8)}…
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted2)', fontSize: 18, lineHeight: 1, padding: 4 }}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
          {isLoading && (
            <div style={{ padding: '24px 0', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontSize: 13, textAlign: 'center' }}>
              Carregando eventos…
            </div>
          )}

          {isError && (
            <div style={{ padding: '24px 0', color: 'var(--color-loss)', fontFamily: 'Inter, sans-serif', fontSize: 13, textAlign: 'center' }}>
              Erro ao carregar eventos.
            </div>
          )}

          {data?.events && data.events.length === 0 && (
            <div style={{ padding: '24px 0', color: 'var(--muted2)', fontFamily: 'Inter, sans-serif', fontSize: 13, textAlign: 'center' }}>
              Nenhum evento registrado para esta ordem.
            </div>
          )}

          {data?.events && data.events.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingTop: 16 }}>
              {data.events.map((evt, idx) => (
                <div key={evt.id ?? idx} style={{ display: 'flex', gap: 14, paddingBottom: 12 }}>
                  {/* Timeline dot + line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', marginTop: 3 }} />
                    {idx < data.events.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 4 }} />
                    )}
                  </div>

                  {/* Event content */}
                  <div style={{ flex: 1, paddingBottom: idx < data.events.length - 1 ? 8 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                        {EVENT_TYPE_LABELS[evt.event_type] ?? evt.event_type}
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: 'var(--muted2)' }}>
                        {fmtDate(evt.created_at)}
                      </span>
                    </div>

                    {/* Payload preview */}
                    {evt.payload && Object.keys(evt.payload).length > 0 && (
                      <div style={{ marginTop: 4, background: 'var(--surface2)', borderRadius: 8, padding: '6px 10px' }}>
                        {Object.entries(evt.payload).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                            <span style={{ color: 'var(--muted2)', fontFamily: 'Inter, sans-serif' }}>{k}:</span>
                            <span style={{ color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
