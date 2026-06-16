/**
 * StepConfigure — Wizard Step 4: Robot name + simulation capital (WIZ-05).
 *
 * - "Nome do robô" input, max 40 chars, live remaining count
 * - Hint: "Único por conta e ambiente · [N] caracteres restantes"
 * - "Estratégia" read-only display + "ALTERAR" link back to Step 1
 * - "Capital para simulação" (only when mode=simulado) default "R$ 5.000,00"
 * - nameError prop shows inline error (409 duplicate name from parent)
 */

import type { RobotMode } from '@/types'

const MAX_NAME = 40

interface StepConfigureProps {
  name: string
  onNameChange: (v: string) => void
  nameError: string | null
  mode: RobotMode | null
  strategyName: string
  onChangeStrategy: () => void
  simulationCapital: string
  onCapitalChange: (v: string) => void
}

export default function StepConfigure({
  name,
  onNameChange,
  nameError,
  mode,
  strategyName,
  onChangeStrategy,
  simulationCapital,
  onCapitalChange,
}: StepConfigureProps) {
  const remaining = MAX_NAME - name.length

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '560px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Robot name */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '6px',
          }}
        >
          Nome do robô
        </label>
        <input
          type="text"
          value={name}
          maxLength={MAX_NAME}
          placeholder="Ex.: Estocástico WIN 5min"
          onChange={(e) => onNameChange(e.target.value)}
          style={{
            background: 'var(--surface2)',
            border: `1px solid ${nameError ? 'var(--color-loss)' : 'var(--border)'}`,
            borderRadius: '10px',
            padding: '10px 13px',
            color: 'var(--text)',
            fontSize: '13.5px',
            fontFamily: 'var(--font-body)',
            width: '100%',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {/* Hint or error */}
        {nameError ? (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-loss)',
              marginTop: '4px',
            }}
          >
            {nameError}
          </div>
        ) : (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--muted2)',
              marginTop: '4px',
            }}
          >
            Único por conta e ambiente · {remaining} caracteres restantes
          </div>
        )}
      </div>

      {/* Strategy (read-only) */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '6px',
          }}
        >
          Estratégia
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '10px 13px',
          }}
        >
          <span
            style={{
              fontSize: '13.5px',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {strategyName}
          </span>
          <button
            onClick={onChangeStrategy}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.07em',
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              flexShrink: 0,
              marginLeft: '8px',
            }}
          >
            ALTERAR
          </button>
        </div>
      </div>

      {/* Capital para simulação — only when Simulado */}
      {mode === 'simulado' && (
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '6px',
            }}
          >
            Capital para simulação
            {/* Tooltip "?" */}
            <span
              title="Patrimônio virtual inicial usado pelo simulador."
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '99px',
                border: '1px solid var(--border2)',
                color: 'var(--muted2)',
                fontSize: '9.5px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'help',
                fontWeight: 400,
                fontFamily: 'var(--font-body)',
                flexShrink: 0,
              }}
            >
              ?
            </span>
          </label>
          <input
            type="text"
            value={simulationCapital}
            onChange={(e) => onCapitalChange(e.target.value)}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '10px 13px',
              color: 'var(--text)',
              fontSize: '13.5px',
              fontFamily: 'var(--font-mono)',
              width: '100%',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div
            style={{
              fontSize: '11px',
              color: 'var(--muted2)',
              marginTop: '4px',
            }}
          >
            Patrimônio virtual inicial usado pelo simulador.
          </div>
        </div>
      )}
    </div>
  )
}
