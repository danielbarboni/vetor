/**
 * ActionRail — fixed right-side rail with 44×44 icon buttons.
 *
 * UI-SPEC:
 *   position:fixed; right:20px; top:50%; transform:translateY(-50%)
 *   background:--surface; border:1px solid --border; border-radius:18px
 *   padding:8px; box-shadow:--shadow; z-index:15
 *   Each button: 44×44px; border-radius:14px; color:--muted
 *   Hover: background:--surface3; color:--text
 *   Backtest icon: color:--color-primary (EDT-04)
 *
 * Buttons (top to bottom):
 *   1. Play/Stop — state-aware (robot.status)
 *   2. Save 💾 — "Salvar parâmetros"
 *   3. Backtest 🧪 — "Criar backtest" (--color-primary, EDT-04)
 *   4. Costs — operational costs (placeholder for plan 12)
 */
import React, { useState } from 'react'
import { Play, Square, Save, FlaskConical, DollarSign } from 'lucide-react'
import type { RobotStatus } from '@/types'

interface ActionRailProps {
  status: RobotStatus
  onStart: () => void
  onStop: () => void
  onSave: () => void
  onBacktest: () => void
  saving?: boolean
}

interface RailButtonProps {
  onClick: () => void
  title: string
  children: React.ReactNode
  color?: string
  disabled?: boolean
}

function RailButton({ onClick, title, children, color, disabled }: RailButtonProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
        background: hovered && !disabled ? 'var(--surface3)' : 'transparent',
        color: color ?? (hovered && !disabled ? 'var(--text)' : 'var(--muted)'),
        transition: 'all 0.15s',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  )
}

export default function ActionRail({
  status,
  onStart,
  onStop,
  onSave,
  onBacktest,
  saving = false,
}: ActionRailProps) {
  const isExecutando = status === 'executando'

  return (
    <div style={{
      position: 'fixed',
      right: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 15,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '18px',
      padding: '8px',
      boxShadow: 'var(--shadow)',
    }}>
      {/* Play / Stop */}
      <RailButton
        onClick={isExecutando ? onStop : onStart}
        title={isExecutando ? 'Parar robô' : 'Iniciar robô'}
        color={isExecutando ? 'var(--color-loss)' : 'var(--color-profit)'}
      >
        {isExecutando
          ? <Square size={18} strokeWidth={1.8} />
          : <Play size={18} strokeWidth={1.8} />
        }
      </RailButton>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border)', margin: '2px 4px' }} />

      {/* Save params (EDT-03) */}
      <RailButton
        onClick={onSave}
        title="Salvar parâmetros"
        disabled={saving || isExecutando}
      >
        <Save size={18} strokeWidth={1.8} />
      </RailButton>

      {/* Backtest shortcut (EDT-04) */}
      <RailButton
        onClick={onBacktest}
        title="Criar backtest"
        color="var(--color-primary)"
      >
        <FlaskConical size={18} strokeWidth={1.8} />
      </RailButton>

      {/* Costs (placeholder — plan 12) */}
      <RailButton
        onClick={() => {/* plan 12 */}}
        title="Custos operacionais"
      >
        <DollarSign size={18} strokeWidth={1.8} />
      </RailButton>
    </div>
  )
}
