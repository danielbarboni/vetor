/**
 * RobotList — /robos screen (ROB-01..07).
 *
 * Three state tabs: EXECUTANDO / PARADOS / ARQUIVADOS.
 * PARADOS includes rascunho sub-state robots.
 * Fetches robots via TanStack Query using api.getRobots.
 * Client-side strategy / posicionados / search filters.
 * Grid or list view toggle.
 * Empty state per tab.
 * CRIAR ROBÔ button + fixed FAB → /robos/wizard.
 *
 * Ported from prototype sc-if isRobos block (lines 168-268).
 */

import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getRobots } from '@/lib/api'
import type { RobotWithMetrics } from '@/lib/api'
import { useRobotsStore, TAB_STATUSES, type RobotTab } from '@/stores/robots'
import RobotCard from '@/components/robot-card/RobotCard'
import RobotFilters from '@/components/robot-card/RobotFilters'

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { id: RobotTab; label: string }[] = [
  { id: 'executando', label: 'EXECUTANDO' },
  { id: 'parados', label: 'PARADOS' },
  { id: 'arquivados', label: 'ARQUIVADOS' },
]

// ─── Empty state component ────────────────────────────────────────────────────

function EmptyState({ onCreateRobot }: { onCreateRobot: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        padding: '90px 0',
        color: 'var(--muted2)',
      }}
    >
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <rect x="4" y="8" width="16" height="11" rx="3" />
        <path d="M12 8V5" />
        <circle cx="12" cy="3.5" r="1.3" />
        <circle cx="9" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
      </svg>
      <div
        style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 600,
          fontSize: '16px',
          color: 'var(--muted)',
        }}
      >
        Nenhum robô neste ambiente
      </div>
      <div style={{ fontSize: '13px' }}>
        Crie um robô a partir de uma estratégia-modelo, sem precisar programar.
      </div>
      <div
        onClick={onCreateRobot}
        style={{
          marginTop: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--color-primary)',
          color: 'var(--color-on-primary)',
          borderRadius: '12px',
          padding: '11px 20px',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '.06em',
          cursor: 'pointer',
        }}
      >
        CRIAR ROBÔ
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RobotList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { activeTab, setActiveTab, strategyFilter, posicionadosOnly, viewMode, searchQuery } =
    useRobotsStore()

  // Fetch all robots for the active tab — includes all statuses in TAB_STATUSES[activeTab]
  // We fetch without status filter and do client-side tab filtering so counts stay fresh
  const { data: allRobots = [], isLoading } = useQuery<RobotWithMetrics[]>({
    queryKey: ['robots'],
    queryFn: () => getRobots(),
  })

  // ── Tab counts ──────────────────────────────────────────────────────────────
  const countExec = allRobots.filter((r) => r.status === 'executando').length
  const countParado = allRobots.filter(
    (r) => r.status === 'parado' || r.status === 'rascunho',
  ).length
  const countArq = allRobots.filter((r) => r.status === 'arquivado').length

  const tabCounts: Record<RobotTab, number> = {
    executando: countExec,
    parados: countParado,
    arquivados: countArq,
  }

  // ── Filter robots for active tab + client-side filters ──────────────────────
  const tabStatuses = TAB_STATUSES[activeTab]

  const visibleRobots = allRobots.filter((r) => {
    if (!tabStatuses.includes(r.status)) return false
    if (strategyFilter.length > 0) {
      const stratLabel =
        r.strategy_type === 'indicadores_tecnicos' ? 'Indicadores Técnicos' : r.strategy_type
      if (!strategyFilter.includes(stratLabel)) return false
    }
    if (posicionadosOnly && r.position === null) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!r.name.toLowerCase().includes(q)) return false
    }
    return true
  })

  function handleCreateRobot() {
    navigate('/robos/wizard')
  }

  function handleMutated() {
    queryClient.invalidateQueries({ queryKey: ['robots'] })
  }

  return (
    <div style={{ padding: '22px 28px 80px', animation: 'fadeUp .25s ease' }}>
      {/* ── Top bar: tabs + filters + CRIAR ROBÔ ──────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        {/* Tab strip */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '4px',
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 14px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  letterSpacing: '.06em',
                  cursor: 'pointer',
                  borderRadius: '9px',
                  background: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? 'var(--color-on-primary)' : 'var(--muted)',
                  transition: 'all .15s',
                }}
              >
                {tab.label}
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10.5px',
                    opacity: 0.7,
                  }}
                >
                  {tabCounts[tab.id]}
                </span>
              </div>
            )
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Filters */}
        <RobotFilters />

        {/* CRIAR ROBÔ button */}
        <div
          onClick={handleCreateRobot}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
            borderRadius: '10px',
            padding: '9px 16px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '.06em',
            cursor: 'pointer',
            transition: 'transform .15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLDivElement).style.transform = '')
          }
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          CRIAR ROBÔ
        </div>
      </div>

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {isLoading && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '60px 0',
            color: 'var(--muted2)',
            fontSize: '13px',
          }}
        >
          Carregando robôs…
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {!isLoading && visibleRobots.length === 0 && (
        <EmptyState onCreateRobot={handleCreateRobot} />
      )}

      {/* ── Robot grid or list ─────────────────────────────────────────── */}
      {!isLoading && visibleRobots.length > 0 && (
        <div
          style={
            viewMode === 'grid'
              ? {
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                  gap: '16px',
                  marginTop: '18px',
                }
              : {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginTop: '18px',
                }
          }
        >
          {visibleRobots.map((robot) => (
            <RobotCard key={robot.id} robot={robot} onMutated={handleMutated} />
          ))}
        </div>
      )}

      {/* ── Fixed FAB ─────────────────────────────────────────────────── */}
      <div
        onClick={handleCreateRobot}
        title="Criar robô"
        style={{
          position: 'fixed',
          right: '30px',
          bottom: '30px',
          width: '54px',
          height: '54px',
          borderRadius: '18px',
          background: 'var(--color-primary)',
          color: 'var(--color-on-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 20,
          transition: 'transform .15s',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLDivElement).style.transform = 'scale(1.07)')
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLDivElement).style.transform = '')
        }
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
    </div>
  )
}
