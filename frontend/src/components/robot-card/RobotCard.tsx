/**
 * RobotCard — pixel-faithful robot card (ROB-02, ROB-03, ROB-04).
 *
 * Layout ported from prototype data-screen="robos" card markup (lines 201-262).
 * All interactive state via React state — no dc-runtime class toggles (Pitfall 5).
 *
 * Sections (top-to-bottom):
 *   1. Meta row: #id, asset, mode badge, ASSINADA badge, spacer, pulse dot, ⋮ menu
 *   2. Name + strategy
 *   3. SparklineChart (ECharts)
 *   4. Position status dot
 *   5. Divider
 *   6. Metrics row: Net Return + Daily Balance + control button
 *   7. MAIS INFO toggle (chevron)
 *   8. MaisInfo expansion
 *   9. Quick action links
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import SparklineChart from '@/components/charts/SparklineChart'
import MaisInfo from './MaisInfo'
import ContextMenu from './ContextMenu'
import Modal from '@/components/ui/Modal'
import * as api from '@/lib/api'
import type { RobotWithMetrics } from '@/lib/api'

interface RobotCardProps {
  robot: RobotWithMetrics
  /** Called after a mutation so parent can invalidate query */
  onMutated?: () => void
}

function fmtBrl(v: number | null): string {
  if (v === null) return '—'
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  return `${v >= 0 ? '+' : '-'}R$ ${formatted}`
}

function fmtBrlUnsigned(v: number | null): string {
  if (v === null) return '—'
  const sign = v >= 0 ? '+' : '-'
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  return `${sign}R$ ${formatted}`
}

export default function RobotCard({ robot, onMutated }: RobotCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [maisInfoOpen, setMaisInfoOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Confirm modals
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isPositive =
    robot.sparkline_data.length >= 2
      ? robot.sparkline_data[robot.sparkline_data.length - 1] >=
        robot.sparkline_data[0]
      : true

  const retColor =
    (robot.net_return ?? 0) >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'
  const diaColor =
    (robot.daily_balance ?? 0) >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'

  // Position dot color
  const posColor =
    robot.position !== null ? 'var(--color-amber)' : 'var(--muted2)'
  const posLabel = robot.position ?? 'Sem posição'

  // Card border: EXECUTANDO gets profit border, others standard
  const cardBorder =
    robot.status === 'executando'
      ? '1px solid var(--color-profit)'
      : '1px solid var(--border)'

  // Control button by state
  const ctrlLabel =
    robot.status === 'executando'
      ? 'PARAR'
      : robot.status === 'arquivado'
        ? 'RESTAURAR'
        : 'INICIAR'

  const ctrlColor =
    robot.status === 'executando' ? 'var(--color-loss)' : 'var(--color-primary)'
  const ctrlBg =
    robot.status === 'executando'
      ? 'var(--tint-loss)'
      : robot.status === 'arquivado'
        ? 'var(--surface3)'
        : 'var(--tint-primary)'

  // Mode badge label from fill_policy
  const modeBadgeLabel =
    robot.mode === 'simulado'
      ? robot.fill_policy === 'pessimista'
        ? 'PESSIMISTA'
        : robot.fill_policy === 'moderado'
          ? 'MODERADO'
          : 'OTIMISTA'
      : null

  // ── Mutation handlers ───────────────────────────────────────────────────────

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['robots'] })
    onMutated?.()
  }, [queryClient, onMutated])

  async function handleCtrl(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      if (robot.status === 'executando') {
        await api.stopRobot(robot.id)
      } else if (robot.status === 'parado' || robot.status === 'rascunho') {
        await api.startRobot(robot.id)
      } else if (robot.status === 'arquivado') {
        await api.unarchiveRobot(robot.id)
      }
      invalidate()
    } catch {
      // Error handling — UI feedback in a later plan
    }
  }

  async function handleArchiveConfirm() {
    try {
      await api.archiveRobot(robot.id)
      invalidate()
    } catch {
      // Error handling — UI feedback in a later plan
    }
    setShowArchiveConfirm(false)
  }

  async function handleDeleteConfirm() {
    try {
      await api.deleteRobot(robot.id)
      invalidate()
    } catch {
      // Error handling — UI feedback in a later plan
    }
    setShowDeleteConfirm(false)
  }

  async function handleDuplicate() {
    try {
      await api.duplicateRobot(robot.id)
      invalidate()
    } catch {
      // ignore
    }
  }

  // ── Archive label for quick action ─────────────────────────────────────────
  const archiveLabel = robot.status === 'arquivado' ? 'DESARQUIVAR' : 'ARQUIVAR'

  return (
    <>
      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--surface)',
          border: cardBorder,
          borderRadius: '16px',
          padding: '16px 16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          cursor: 'pointer',
          transition: 'all .18s',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'var(--border2)'
          el.style.transform = 'translateY(-2px)'
          el.style.boxShadow = 'var(--shadow)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor =
            robot.status === 'executando' ? 'var(--color-profit)' : 'var(--border)'
          el.style.transform = ''
          el.style.boxShadow = ''
        }}
        onClick={() => navigate(`/robos/${robot.id}/sumario`)}
      >
        {/* 1. Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10.5px',
              color: 'var(--muted2)',
            }}
          >
            #{robot.id.slice(0, 8)}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            {robot.asset}
          </span>

          {/* Mode badge (SIMULADO only) */}
          {modeBadgeLabel && (
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '.09em',
                padding: '3px 7px',
                borderRadius: '99px',
                background: 'var(--surface3)',
                color: 'var(--muted)',
              }}
            >
              {modeBadgeLabel}
            </span>
          )}

          {/* ASSINADA badge */}
          {robot.status !== 'arquivado' && robot.mode === 'real' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '.08em',
                padding: '3px 8px',
                borderRadius: '99px',
                background: 'var(--tint-primary)',
                color: 'var(--color-primary)',
              }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.6 6.6L21 9.3l-5 4.5 1.4 6.9L12 17l-5.4 3.7L8 13.8 3 9.3l6.4-.7z" />
              </svg>
              ASSINADA
            </span>
          )}

          <span style={{ flex: 1 }} />

          {/* Pulse dot — EXECUTANDO only */}
          {robot.status === 'executando' && (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '99px',
                background: 'var(--color-profit)',
                animation: 'pulseDot 2s infinite',
                flexShrink: 0,
              }}
            />
          )}

          {/* ⋮ Context menu trigger */}
          <div
            style={{ position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              title="Opções"
              style={{ cursor: 'pointer', color: 'var(--muted2)', padding: '2px 4px' }}
              onClick={() => setMenuOpen((v) => !v)}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.color = 'var(--text)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.color = 'var(--muted2)')
              }
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5.5" r="1.4" />
                <circle cx="12" cy="12" r="1.4" />
                <circle cx="12" cy="18.5" r="1.4" />
              </svg>
            </div>
            <ContextMenu
              robotId={robot.id}
              status={robot.status}
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              onVerSumario={() => navigate(`/robos/${robot.id}/sumario`)}
              onEditarParametros={() => navigate(`/robos/${robot.id}/parametros`)}
              onIniciar={async () => {
                await api.startRobot(robot.id)
                invalidate()
              }}
              onParar={async () => {
                await api.stopRobot(robot.id)
                invalidate()
              }}
              onArquivar={() => setShowArchiveConfirm(true)}
              onDesarquivar={async () => {
                await api.unarchiveRobot(robot.id)
                invalidate()
              }}
              onExcluir={() => setShowDeleteConfirm(true)}
              onCriarBacktest={() => navigate(`/backtests?robot=${robot.id}`)}
              onDuplicar={handleDuplicate}
            />
          </div>
        </div>

        {/* 2. Name + strategy */}
        <div>
          <div
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 600,
              fontSize: '15.5px',
            }}
          >
            {robot.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
            {robot.strategy_type === 'indicadores_tecnicos'
              ? 'Indicadores Técnicos'
              : robot.strategy_type}
          </div>
        </div>

        {/* 3. SparklineChart */}
        <div>
          <SparklineChart sparkline_data={robot.sparkline_data} positive={isPositive} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '9.5px',
              color: 'var(--muted2)',
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: '4px',
            }}
          >
            <span>30d atrás</span>
            <span>15d atrás</span>
            <span>hoje</span>
          </div>
        </div>

        {/* 4. Position status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '12px',
            color: 'var(--muted)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '99px',
              background: posColor,
              flexShrink: 0,
            }}
          />
          {posLabel}
        </div>

        {/* 5. Divider */}
        <div style={{ height: '1px', background: 'var(--border)' }} />

        {/* 6. Metrics row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <div
              style={{
                fontSize: '9.5px',
                fontWeight: 700,
                letterSpacing: '.09em',
                color: 'var(--muted2)',
              }}
            >
              RETORNO LÍQ.
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                fontSize: '16px',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                color: retColor,
              }}
            >
              {fmtBrl(robot.net_return)}
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                fontSize: '9.5px',
                fontWeight: 700,
                letterSpacing: '.09em',
                color: 'var(--muted2)',
              }}
            >
              SALDO DIÁRIO
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                fontSize: '13px',
                marginTop: '4px',
                whiteSpace: 'nowrap',
                color: diaColor,
              }}
            >
              {fmtBrlUnsigned(robot.daily_balance)}
            </div>
          </div>

          <button
            onClick={handleCtrl}
            style={{
              border: 'none',
              background: ctrlBg,
              borderRadius: '9px',
              padding: '9px 14px',
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '.07em',
              cursor: 'pointer',
              transition: 'all .15s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              color: ctrlColor,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.12)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.filter = '')
            }
          >
            {ctrlLabel}
          </button>
        </div>

        {/* 7. MAIS INFO toggle */}
        <div
          onClick={(e) => {
            e.stopPropagation()
            setMaisInfoOpen((v) => !v)
          }}
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '.1em',
            color: 'var(--muted2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            paddingTop: '2px',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLDivElement).style.color = 'var(--text)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLDivElement).style.color = 'var(--muted2)')
          }
        >
          {maisInfoOpen ? 'MENOS INFO' : 'MAIS INFO'}
          <span
            style={{
              display: 'inline-flex',
              transition: 'transform .2s',
              transform: maisInfoOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9.5l6 6 6-6" />
            </svg>
          </span>
        </div>

        {/* 8. MaisInfo panel */}
        {maisInfoOpen && (
          <MaisInfo
            total_trades={robot.total_trades}
            profitable_pct={robot.profitable_pct}
            profit_factor={robot.profit_factor}
            max_drawdown={robot.max_drawdown}
          />
        )}

        {/* 9. Quick action links */}
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', paddingTop: '6px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <span
            onClick={() => navigate(`/robos/${robot.id}/parametros`)}
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '.08em',
              color: 'var(--muted2)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLSpanElement).style.color = 'var(--color-primary)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLSpanElement).style.color = 'var(--muted2)')
            }
          >
            CONFIGURAR
          </span>

          {robot.status !== 'arquivado' && (
            <span
              onClick={handleDuplicate}
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '.08em',
                color: 'var(--muted2)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLSpanElement).style.color = 'var(--color-primary)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLSpanElement).style.color = 'var(--muted2)')
              }
            >
              DUPLICAR
            </span>
          )}

          <span
            onClick={() =>
              robot.status === 'arquivado'
                ? (async () => {
                    await api.unarchiveRobot(robot.id)
                    invalidate()
                  })()
                : setShowArchiveConfirm(true)
            }
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '.08em',
              color: 'var(--muted2)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLSpanElement).style.color = 'var(--color-primary)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLSpanElement).style.color = 'var(--muted2)')
            }
          >
            {archiveLabel}
          </span>

          <span
            onClick={() => navigate(`/backtests?robot=${robot.id}`)}
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '.08em',
              color: 'var(--muted2)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLSpanElement).style.color = 'var(--color-primary)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLSpanElement).style.color = 'var(--muted2)')
            }
          >
            CRIAR BACKTEST
          </span>
        </div>
      </div>

      {/* ── Destructive confirm modals ────────────────────────────────────── */}
      {showArchiveConfirm && (
        <Modal open={showArchiveConfirm} onClose={() => setShowArchiveConfirm(false)}>
          <div style={{ padding: '24px' }}>
            <div
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
                fontSize: '16px',
                marginBottom: '12px',
              }}
            >
              Arquivar robô
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 20px' }}>
              O robô será arquivado e deixará de operar. Você pode restaurá-lo depois.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowArchiveConfirm(false)}
                style={{
                  background: 'var(--surface2)',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '9px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--text)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleArchiveConfirm}
                style={{
                  background: 'var(--tint-loss)',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '9px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--color-loss)',
                }}
              >
                Arquivar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
          <div style={{ padding: '24px' }}>
            <div
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
                fontSize: '16px',
                marginBottom: '12px',
              }}
            >
              Excluir robô
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 20px' }}>
              Esta ação é irreversível. Todos os dados do robô serão removidos permanentemente.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  background: 'var(--surface2)',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '9px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--text)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  background: 'var(--tint-loss)',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '9px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--color-loss)',
                }}
              >
                Excluir permanentemente
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
