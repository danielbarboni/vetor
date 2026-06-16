/**
 * RobotSumario — Robot Sumário report screen (SUM-01..SUM-05).
 *
 * Route: /robos/:id/sumario
 *
 * Prototype region: editor SUMÁRIO tab (screen==='editor', SUMÁRIO active).
 * Layout: header (SUM-01) + period selector + EXPORTAR CSV + MetricCards (SUM-02)
 *         + RelatorioCompleto accordion (SUM-03) + OrderList (SUM-04/SUM-05).
 *
 * Realtime: useRobotRealtime (Supabase postgres_changes D-02) + useTickStream (WS D-01).
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { getRobotSumario, getRobotEquity, getRobotOrders } from '@/lib/api'
import type { SumarioPeriod } from '@/lib/api'

import { useRobotRealtime } from '@/hooks/useRobotRealtime'
import { useTickStream } from '@/hooks/useTickStream'

import MetricCards from '@/components/sumario/MetricCards'
import RelatorioCompleto from '@/components/sumario/RelatorioCompleto'
import OrderList from '@/components/sumario/OrderList'
import { downloadOrdersCsv } from '@/components/sumario/csv'

const PERIODS: SumarioPeriod[] = ['HOJE', '7D', '30D', 'TUDO']

const STATUS_DOT: Record<string, string> = {
  executando: 'var(--color-profit)',
  parado: 'var(--muted2)',
  rascunho: 'var(--muted2)',
  arquivado: 'var(--muted2)',
}

function fmtSavedAt(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

export default function RobotSumario() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const robotId = id ?? ''

  const [period, setPeriod] = useState<SumarioPeriod>('TUDO')

  // Start the shared tick WS (D-01/D-04) — call it here so it's active while the screen is mounted
  useTickStream()

  // Supabase Realtime subscriptions (D-02) — order changes trigger query invalidation (D-03)
  useRobotRealtime({ robotId })

  // Fetch sumário metrics
  const { data: sumario, isLoading, isError } = useQuery({
    queryKey: ['sumario', robotId, period],
    queryFn: () => getRobotSumario(robotId, period),
    staleTime: 60_000,
    enabled: !!robotId,
  })

  // Fetch equity series (D-03)
  const { data: equityData } = useQuery({
    queryKey: ['equity', robotId, period],
    queryFn: () => getRobotEquity(robotId, period),
    staleTime: 60_000,
    enabled: !!robotId,
  })

  const equitySeries = equityData?.series ?? []

  // For CSV export of all orders in the current period view
  const { data: allOrdersData } = useQuery({
    queryKey: ['orders-all', robotId, period],
    queryFn: () => getRobotOrders(robotId, { period, page: 1, page_size: 200 }),
    staleTime: 60_000,
    enabled: !!robotId,
  })

  function handleExportAllCsv() {
    const orders = allOrdersData?.orders ?? []
    downloadOrdersCsv(orders, `ordens-${robotId}.csv`)
  }

  if (!robotId) {
    return (
      <div style={{ padding: '22px 28px', color: 'var(--color-loss)', fontFamily: 'Inter, sans-serif' }}>
        ID do robô não encontrado.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ padding: '22px 28px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
        Carregando sumário…
      </div>
    )
  }

  if (isError || !sumario) {
    return (
      <div style={{ padding: '22px 28px', color: 'var(--color-loss)', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
        Erro ao carregar sumário do robô.
      </div>
    )
  }

  const statusDotColor = STATUS_DOT[sumario.status] ?? 'var(--muted2)'
  const isSimulado = sumario.mode === 'simulado'

  return (
    <div style={{ padding: '20px 92px 80px 28px', animation: 'fadeUp 0.25s ease' }}>

      {/* SUM-01: Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Back breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <button
              type="button"
              onClick={() => navigate('/robos')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted2)', fontFamily: 'Inter, sans-serif', fontSize: 11.5, padding: 0 }}
            >
              Robôs
            </button>
            <span style={{ color: 'var(--muted2)', fontSize: 11.5 }}>›</span>
            <span style={{ color: 'var(--muted2)', fontFamily: 'Inter, sans-serif', fontSize: 11.5 }}>Sumário</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Status dot */}
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusDotColor, display: 'inline-block', flexShrink: 0 }} />

            {/* Robot name */}
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 19, color: 'var(--text)', margin: 0 }}>
              {sumario.name}
            </h1>

            {/* Simulator badge */}
            {isSimulado && (
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 8.5, fontWeight: 700,
                letterSpacing: '0.09em',
                color: 'var(--muted)',
                background: 'var(--surface3)',
                borderRadius: 99,
                padding: '3px 8px',
                textTransform: 'uppercase',
              }}>
                Simulado
              </span>
            )}
          </div>

          {/* Meta row: ID · strategy · asset · contract · ÚLTIMO SALVAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--muted)' }}>
              #{robotId.slice(0, 8)}
            </span>
            <span style={{ color: 'var(--muted2)', fontSize: 11 }}>·</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'var(--muted)' }}>
              {sumario.strategy_type}
            </span>
            <span style={{ color: 'var(--muted2)', fontSize: 11 }}>·</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text)', fontWeight: 700 }}>
              {sumario.effective_contract ?? sumario.asset}
            </span>
            {sumario.params_saved_at && (
              <>
                <span style={{ color: 'var(--muted2)', fontSize: 11 }}>·</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'var(--muted2)' }}>
                  ÚLTIMO SALVAR: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtSavedAt(sumario.params_saved_at)}</span>
                </span>
              </>
            )}
            {!sumario.params_saved_at && (
              <>
                <span style={{ color: 'var(--muted2)', fontSize: 11 }}>·</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'var(--muted2)' }}>
                  ÚLTIMO SALVAR: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>—</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Period selector + Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Period chips */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 99, padding: 4 }}>
            {PERIODS.map((p) => {
              const active = p === period
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    padding: '5px 12px',
                    borderRadius: 99,
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? 'var(--surface3)' : 'transparent',
                    color: active ? 'var(--text)' : 'var(--muted2)',
                    transition: 'all 0.15s',
                  }}
                >
                  {p}
                </button>
              )
            })}
          </div>

          {/* Export CSV button */}
          <button
            type="button"
            onClick={handleExportAllCsv}
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
      </div>

      {/* SUM-02: Metric cards + equity chart */}
      <MetricCards sumario={sumario} equitySeries={equitySeries} robotId={robotId} />

      {/* SUM-03: RELATÓRIO COMPLETO accordion */}
      <div style={{ marginTop: 20 }}>
        <RelatorioCompleto relatorio={sumario.relatorio} />
      </div>

      {/* SUM-04 / SUM-05: Order list (with event modal) */}
      <div style={{ marginTop: 20 }}>
        <OrderList robotId={robotId} period={period} />
      </div>
    </div>
  )
}
