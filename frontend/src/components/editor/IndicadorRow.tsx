/**
 * IndicadorRow — renders a single indicator block inside the IT section.
 *
 * When habilitado=false: shows only the toggle + indicator name.
 * When habilitado=true: reveals common fields (Habilitar Inversão, Modo de Operação,
 *   Forma de Uso) + all specificFields from the indicator def, with conditional
 *   reveals for filter toggles.
 *
 * UI-SPEC: param row grid 250px/1fr, Inter 13px w500 label, --muted2 hint
 * Execution lock: all fields read-only when locked=true.
 */
import React from 'react'
import Toggle from '@/components/ui/Toggle'
import type { IndicatorDef, IndicatorField } from '@/data/indicatorDefs'
import { INDICADOR_MODO_OPERACAO_OPTIONS } from '@/data/indicatorDefs'

interface IndicadorRowProps {
  def: IndicatorDef
  /** Current values for this indicator (keyed by field key) */
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  locked: boolean
}

function ParamRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '250px 1fr',
      gap: '14px',
      alignItems: 'center',
      padding: '13px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
          {label}
        </div>
        {hint && (
          <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
            {hint}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}

function FieldInput({
  field,
  value,
  onChange,
  locked,
  values,
}: {
  field: IndicatorField
  value: unknown
  onChange: (val: unknown) => void
  locked: boolean
  values: Record<string, unknown>
}) {
  // Conditional reveal: skip if revealedBy toggle is false
  if (field.revealedBy) {
    if (!values[field.revealedBy]) return null
  }

  const inputStyle: React.CSSProperties = {
    background: locked ? 'var(--surface3)' : 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '10px 13px',
    color: locked ? 'var(--muted)' : 'var(--color-text-hi)',
    fontSize: '13px',
    width: '100%',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
  }

  if (field.type === 'toggle') {
    return (
      <Toggle
        value={!!value}
        onChange={onChange}
        disabled={locked}
      />
    )
  }

  if (field.type === 'dropdown') {
    return (
      <select
        value={String(value ?? field.defaultValue ?? '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={locked}
        style={{ ...inputStyle, cursor: locked ? 'not-allowed' : 'pointer' }}
      >
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={value !== undefined ? String(value) : String(field.defaultValue ?? '')}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        disabled={locked}
        min={field.positiveInteger ? 1 : undefined}
        style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace' }}
      />
    )
  }

  if (field.type === 'decimal') {
    return (
      <input
        type="number"
        step="0.01"
        value={value !== undefined ? String(value) : String(field.defaultValue ?? '')}
        onChange={(e) => onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
        disabled={locked}
        style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace' }}
      />
    )
  }

  if (field.type === 'button-group') {
    return (
      <div style={{ display: 'flex', gap: '6px' }}>
        {field.options?.map((opt) => (
          <button
            key={opt.value}
            onClick={() => !locked && onChange(opt.value)}
            disabled={locked}
            style={{
              width: '36px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border2)',
              background: value === opt.value ? 'var(--color-primary)' : 'var(--surface2)',
              color: value === opt.value ? 'var(--color-on-primary)' : 'var(--muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: locked ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    )
  }

  return null
}

export default function IndicadorRow({ def, values, onChange, locked }: IndicadorRowProps) {
  const habilitado = !!values.habilitado

  return (
    <div style={{
      background: 'var(--surface2)',
      borderRadius: '10px',
      marginBottom: '8px',
      overflow: 'hidden',
    }}>
      {/* Header row with enable toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        cursor: locked ? 'default' : 'pointer',
      }}>
        <Toggle
          value={habilitado}
          onChange={(v) => onChange('habilitado', v)}
          disabled={locked}
        />
        <span style={{
          fontSize: '13px',
          fontWeight: 600,
          color: habilitado ? 'var(--text)' : 'var(--muted)',
          fontFamily: 'Inter, sans-serif',
          transition: 'color 0.15s',
        }}>
          {def.name}
        </span>
      </div>

      {/* Revealed fields when enabled */}
      {habilitado && (
        <div style={{
          padding: '0 16px 14px',
          borderTop: '1px solid var(--border)',
        }}>
          {/* Common field 1: Habilitar Inversão */}
          <ParamRow label="Habilitar Inversão" hint="Inverte compra ↔ venda">
            <Toggle
              value={!!values.habilitar_inversao}
              onChange={(v) => onChange('habilitar_inversao', v)}
              disabled={locked}
            />
          </ParamRow>

          {/* Common field 2: Modo de Operação */}
          <ParamRow label="Modo de Operação">
            <select
              value={String(values.modo_operacao ?? 'entradas_e_saidas')}
              onChange={(e) => onChange('modo_operacao', e.target.value)}
              disabled={locked}
              style={{
                background: locked ? 'var(--surface3)' : 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '10px 13px',
                color: locked ? 'var(--muted)' : 'var(--color-text-hi)',
                fontSize: '13px',
                width: '100%',
                fontFamily: 'Inter, sans-serif',
                cursor: locked ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box',
              }}
            >
              {INDICADOR_MODO_OPERACAO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </ParamRow>

          {/* Common field 3: Forma de Uso (if indicator has options) */}
          {def.formaDeUsoOptions.length > 0 && (
            <ParamRow label="Forma de uso">
              <select
                value={String(values.forma_uso ?? def.formaDeUsoOptions[0]?.value ?? '')}
                onChange={(e) => onChange('forma_uso', e.target.value)}
                disabled={locked}
                style={{
                  background: locked ? 'var(--surface3)' : 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '10px 13px',
                  color: locked ? 'var(--muted)' : 'var(--color-text-hi)',
                  fontSize: '13px',
                  width: '100%',
                  fontFamily: 'Inter, sans-serif',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                {def.formaDeUsoOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </ParamRow>
          )}

          {/* Specific fields */}
          {def.specificFields.map((field) => {
            // For toggle fields with revealedBy, the FieldInput handles the reveal check
            // but we still need to conditionally render the ParamRow wrapper
            if (field.revealedBy && !values[field.revealedBy]) return null

            return (
              <ParamRow key={field.key} label={field.label} hint={field.hint}>
                <FieldInput
                  field={field}
                  value={values[field.key]}
                  onChange={(v) => onChange(field.key, v)}
                  locked={locked}
                  values={values}
                />
              </ParamRow>
            )
          })}
        </div>
      )}
    </div>
  )
}
