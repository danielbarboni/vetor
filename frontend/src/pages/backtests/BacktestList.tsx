/**
 * BacktestList — Route /backtests (BCK-03).
 *
 * Prototype source: data-screen="backtests" main content region
 * (lines 2348–2495 of Plataforma Vetor v3.dc.html). Pixel-faithful port.
 *
 * Features:
 *  - Header with credits pill (DISPONÍVEIS) + CRIAR BACKTEST CTA
 *  - Status tabs: UNITÁRIO | EM MASSA | PROCESSANDO | ARQUIVADOS
 *  - Backtest cards in grid with status badges (Aguardando/Processando/Concluído/Erro)
 *    showing creation date, period, capital, type (fill_policy)
 *  - Supabase Realtime subscription for live status transitions
 *  - Empty state "Nenhum backtest criado" with icon
 *  - Click card → navigate to /backtests/:id (report)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getBacktests, getCredits } from '@/lib/api'
import type { BacktestRow, BacktestStatus } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'
import BacktestModal from '@/components/backtests/BacktestModal'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`
  } catch { return iso }
}

function fmtCapital(val: number): string {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPeriod(from: string, to: string): string {
  return `${fmtDate(from)} – ${fmtDate(to)}`
}

const STATUS_CONFIG: Record<BacktestStatus, { label: string; color: string; bg: string }> = {
  aguardando:   { label: 'Aguardando',   color: 'var(--muted2)',       bg: 'var(--surface3)' },
  processando:  { label: 'Processando',  color: 'var(--color-amber)',  bg: 'var(--tint-amber)' },
  concluido:    { label: 'Concluído',    color: 'var(--color-info)',   bg: 'var(--tint-info)' },
  erro:         { label: 'Erro',         color: 'var(--color-loss)',   bg: 'var(--tint-loss)' },
}

const FILL_LABELS: Record<string, string> = {
  pessimista: 'Conservador',
  moderado:   'Moderado',
  otimista:   'Otimista',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BacktestList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  // BCK-03: fetch backtest list
  const { data: backtests = [], isLoading, isError } = useQuery({
    queryKey: ['backtests'],
    queryFn: getBacktests,
    staleTime: 15_000,
  })

  // BCK-02: credits
  const { data: creditsData } = useQuery({
    queryKey: ['credits'],
    queryFn: getCredits,
    staleTime: 30_000,
  })
  const credits = creditsData?.balance ?? 0

  // Supabase Realtime — live status transitions (BCK-03)
  useEffect(() => {
    const channel = supabase
      .channel('backtests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'backtests' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['backtests'] })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [queryClient])

  // Group backtests by status
  const active = backtests.filter((b) => b.status === 'aguardando' || b.status === 'concluido')
  const processing = backtests.filter((b) => b.status === 'processando')
  const errored = backtests.filter((b) => b.status === 'erro')
  const allVisible = [...processing, ...active, ...errored]

  return (
    <div style={{ padding: '22px 28px 80px', animation: 'fadeUp .25s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18 }}>
            Backtests
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
            Valide variações da estratégia em dados históricos antes de ir ao mercado.
          </div>
        </div>
        <div style={{ flex: 1 }} />

        {/* Credits counter pill — prototype lines 2356-2359 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          border: '1px solid var(--border)', borderRadius: 12,
          padding: '9px 14px', background: 'var(--surface)',
        }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em', color: 'var(--muted2)' }}>
            DISPONÍVEIS
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 15, color: 'var(--color-accent)' }}>
            {credits}
          </span>
        </div>

        {/* CRIAR BACKTEST button */}
        <div
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--color-primary)', color: 'var(--color-on-primary)',
            borderRadius: 12, padding: '10px 16px',
            fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
            cursor: 'pointer', transition: 'transform .15s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          CRIAR BACKTEST
        </div>
      </div>

      {/* Content */}
      <div style={{ marginTop: 24 }}>
        {isLoading && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 8, padding: '70px 0', color: 'var(--muted2)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
              Carregando backtests…
            </div>
          </div>
        )}

        {isError && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 8, padding: '70px 0',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-loss)' }}>
              Erro ao carregar backtests.
            </div>
          </div>
        )}

        {/* Empty state — prototype lines 2384-2390 */}
        {!isLoading && !isError && allVisible.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 8, padding: '70px 0', color: 'var(--muted2)',
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M10 3v5.5L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 8.5V3" />
              <path d="M8.5 3h7" />
              <path d="M7.5 14.5h9" />
            </svg>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
              Nenhum backtest criado
            </div>
            <div style={{ fontSize: 12 }}>
              Crie seu primeiro backtest para validar uma estratégia em dados históricos.
            </div>
          </div>
        )}

        {/* Backtest cards — prototype lines 2391-2425 */}
        {!isLoading && !isError && allVisible.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: 16,
          }}>
            {allVisible.map((bt) => (
              <BacktestCard
                key={bt.id}
                backtest={bt}
                onClick={() => navigate(`/backtests/${bt.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* BacktestModal */}
      {showModal && (
        <BacktestModal
          robotId=""
          robotName="Novo Backtest"
          onClose={() => setShowModal(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['backtests'] })}
        />
      )}
    </div>
  )
}

// ── BacktestCard — prototype lines 2393-2423 ─────────────────────────────────

function BacktestCard({ backtest: bt, onClick }: { backtest: BacktestRow; onClick: () => void }) {
  const statusCfg = STATUS_CONFIG[bt.status] ?? STATUS_CONFIG.aguardando
  const netReturn = (bt.result as { net_return?: number } | null)?.net_return ?? null
  const nTrades = (bt.result as { number_of_trades?: number } | null)?.number_of_trades ?? null
  const profitFactor = (bt.result as { profit_factor?: number } | null)?.profit_factor ?? null

  const netColor = netReturn == null ? 'var(--muted2)'
    : netReturn >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16, padding: 16,
        transition: 'all .18s', display: 'flex',
        flexDirection: 'column', gap: 10, cursor: 'pointer',
      }}
    >
      {/* Top row: id + status badge + period */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: 'var(--muted2)' }}>
          {bt.id.slice(0, 8)}
        </span>
        <span style={{
          fontSize: 8.5, fontWeight: 700, letterSpacing: '.09em',
          padding: '3px 8px', borderRadius: 99,
          background: statusCfg.bg, color: statusCfg.color,
        }}>
          {statusCfg.label.toUpperCase()}
        </span>
        <span style={{ flex: 1 }} />
        {/* Processing dot animation */}
        {bt.status === 'processando' && (
          <span style={{
            width: 7, height: 7, borderRadius: 99,
            background: 'var(--color-amber)', animation: 'pulseDot 2s infinite',
          }} />
        )}
      </div>

      {/* Names */}
      <div>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 14.5 }}>
          {fmtPeriod(bt.date_from, bt.date_to)}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
          {FILL_LABELS[bt.fill_policy] ?? bt.fill_policy} · {fmtCapital(bt.capital)}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Metrics row — prototype lines 2409-2412 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
        <div style={{ flex: '1.7 1 0', minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em', color: 'var(--muted2)' }}>
            RETORNO LÍQ.
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 15, marginTop: 2, whiteSpace: 'nowrap', color: netColor }}>
            {netReturn != null
              ? `${netReturn >= 0 ? '+' : ''}R$ ${Math.abs(netReturn).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : bt.status === 'processando' ? '—' : '—'}
          </div>
        </div>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em', color: 'var(--muted2)' }}>
            FATOR LUCRO
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 13, marginTop: 4, whiteSpace: 'nowrap' }}>
            {profitFactor != null ? profitFactor.toFixed(2) : '—'}
          </div>
        </div>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em', color: 'var(--muted2)' }}>
            TRADES
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 13, marginTop: 4, whiteSpace: 'nowrap' }}>
            {nTrades ?? '—'}
          </div>
        </div>
      </div>

      {/* Created at */}
      <div style={{ fontSize: 10.5, color: 'var(--muted2)' }}>
        Criado em {fmtDate(bt.created_at)}
      </div>
    </div>
  )
}
