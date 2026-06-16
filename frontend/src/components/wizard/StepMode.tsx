/**
 * StepMode — Wizard Step 2: Mode selection (WIZ-03).
 *
 * Two mode cards:
 *   Simulado — RECOMENDADO badge, --tint-primary icon, virtual portfolio description
 *   Real     — --tint-amber icon/border, real orders description
 */

import type { RobotMode } from '@/types'

interface StepModeProps {
  selected: RobotMode | null
  onSelect: (mode: RobotMode) => void
}

interface ModeOption {
  id: RobotMode
  title: string
  description: string
  recommended: boolean
  iconBg: string
  iconColor: string
  iconContent: string
}

const MODES: ModeOption[] = [
  {
    id: 'simulado',
    title: 'Modo Simulado',
    description:
      'Carteira virtual com cotações reais e simulador pessimista. Nenhuma ordem é enviada à corretora.',
    recommended: true,
    iconBg: 'var(--tint-primary)',
    iconColor: 'var(--color-primary)',
    iconContent: '◎',
  },
  {
    id: 'real',
    title: 'Modo Real',
    description:
      'Envio de ordens reais à corretora. Requer conta vinculada, termo de risco aceito e plano elegível.',
    recommended: false,
    iconBg: 'var(--tint-amber)',
    iconColor: 'var(--color-amber)',
    iconContent: '⚡',
  },
]

export default function StepMode({ selected, onSelect }: StepModeProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '14px',
      }}
    >
      {MODES.map((mode) => {
        const isSelected = selected === mode.id

        return (
          <div
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            style={{
              border: `1px solid ${isSelected ? 'var(--color-primary)' : mode.id === 'real' && !isSelected ? 'var(--color-amber)' : 'var(--border)'}`,
              background: isSelected ? 'var(--tint-primary)' : 'var(--surface)',
              borderRadius: '16px',
              padding: '22px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Top row: icon + RECOMENDADO badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: mode.iconBg,
                  color: mode.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}
              >
                {mode.iconContent}
              </div>

              {mode.recommended && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.09em',
                    color: 'var(--color-primary)',
                    background: 'var(--tint-primary)',
                    borderRadius: '99px',
                    padding: '3px 9px',
                    textTransform: 'uppercase',
                  }}
                >
                  RECOMENDADO
                </span>
              )}
            </div>

            {/* Title */}
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '15.5px',
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              {mode.title}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 400,
                color: 'var(--muted)',
                lineHeight: 1.5,
              }}
            >
              {mode.description}
            </div>
          </div>
        )
      })}
    </div>
  )
}
