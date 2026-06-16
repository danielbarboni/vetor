/**
 * StepIndicator — 4-step wizard progress indicator.
 *
 * UI-SPEC:
 *   .stc  → inactive:  border --border2, color --muted2
 *   .stc-act → active: bg --color-primary, color --color-on-primary
 *   .stc-done → done:  border --color-primary, color --color-primary
 *   Connector: flex:1; height:1px; background:--border2
 *   .stl label: 12px, w600, 0.04em spacing, --muted2 / --text active / --color-primary done
 */

const STEPS = ['ESTRATÉGIA', 'MODO', 'DADOS', 'CONFIGURAR'] as const

interface StepIndicatorProps {
  current: number // 1-based
}

export default function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        margin: '26px 0 28px',
      }}
    >
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1
        const isDone = stepNum < current
        const isActive = stepNum === current

        const circleStyle: React.CSSProperties = {
          width: '28px',
          height: '28px',
          borderRadius: '99px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          fontWeight: 700,
          flexShrink: 0,
          transition: 'all 0.15s',
          ...(isActive
            ? {
                background: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                border: '1px solid var(--color-primary)',
              }
            : isDone
              ? {
                  background: 'transparent',
                  border: '1px solid var(--color-primary)',
                  color: 'var(--color-primary)',
                }
              : {
                  background: 'transparent',
                  border: '1px solid var(--border2)',
                  color: 'var(--muted2)',
                }),
        }

        const labelStyle: React.CSSProperties = {
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-body)',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s',
          ...(isActive
            ? { color: 'var(--text)' }
            : isDone
              ? { color: 'var(--color-primary)' }
              : { color: 'var(--muted2)' }),
        }

        return (
          <div key={label} style={{ display: 'contents' }}>
            {/* Step circle + label pair */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={circleStyle}>{isDone ? '✓' : stepNum}</div>
              <span style={labelStyle}>{label}</span>
            </div>

            {/* Connector between steps */}
            {idx < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background: 'var(--border2)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
