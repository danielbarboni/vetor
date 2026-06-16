/**
 * PreferenciasTab.tsx — CTR-03: User preferences (Minha Conta tab 3)
 *
 * Sections:
 * - NOTIFICAÇÕES POR E-MAIL: 3 toggles
 * - SIMULAÇÃO: default simulator type segment control
 * - FORMATAÇÃO DE VALORES: decimal/thousands separator segment controls with preview
 *
 * Copy: exact PT-BR from UI-SPEC § Minha Conta
 */
import React, { useEffect, useState } from 'react'
import Toggle from '@/components/ui/Toggle'
import SegmentControl from '@/components/ui/SegmentControl'
import { getPreferences, updatePreferences } from '@/lib/api'
import type { UserPreferences } from '@/lib/api'

// ── component ─────────────────────────────────────────────────────────────────

const SIMULATOR_OPTIONS = [
  { value: 'pessimista', label: 'Pessimista' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'otimista', label: 'Otimista' },
]

const DECIMAL_OPTIONS = [
  { value: 'comma', label: '1.234,56' },
  { value: 'dot', label: '1,234.56' },
]

function formatPreview(prefs: Partial<UserPreferences>): string {
  if (prefs.decimal_separator === 'dot') {
    return 'R$ 1,234.56'
  }
  return 'R$ 1.234,56'
}

export default function PreferenciasTab() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getPreferences().then(setPrefs).catch(() => {})
  }, [])

  async function handleChange(patch: Partial<UserPreferences>) {
    if (!prefs) return
    const next = { ...prefs, ...patch }
    setPrefs(next)
    setSaving(true)
    try {
      const saved = await updatePreferences(patch)
      setPrefs(saved)
    } catch {
      /* revert on error */
      setPrefs(prefs)
    } finally {
      setSaving(false)
    }
  }

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: 'var(--muted2)',
    fontFamily: 'Inter, sans-serif',
    marginBottom: '4px',
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid var(--border)',
  }

  const rowLabelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text)',
    fontFamily: 'Inter, sans-serif',
  }

  return (
    <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* ── NOTIFICAÇÕES POR E-MAIL ────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '22px',
      }}>
        <div style={{ ...sectionLabelStyle, marginBottom: '4px' }}>
          NOTIFICAÇÕES POR E-MAIL
        </div>

        <div style={{ ...rowStyle }}>
          <span style={rowLabelStyle}>Execuções de ordens</span>
          <Toggle
            value={prefs?.email_notifications_executions ?? true}
            onChange={(v) => handleChange({ email_notifications_executions: v })}
            disabled={!prefs || saving}
          />
        </div>

        <div style={{ ...rowStyle }}>
          <span style={rowLabelStyle}>Parada de robô</span>
          <Toggle
            value={prefs?.email_notifications_stops ?? true}
            onChange={(v) => handleChange({ email_notifications_stops: v })}
            disabled={!prefs || saving}
          />
        </div>

        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span style={rowLabelStyle}>Alerta de margem</span>
          <Toggle
            value={prefs?.email_notifications_margin ?? true}
            onChange={(v) => handleChange({ email_notifications_margin: v })}
            disabled={!prefs || saving}
          />
        </div>
      </div>

      {/* ── SIMULAÇÃO ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '22px',
      }}>
        <div style={sectionLabelStyle}>SIMULAÇÃO</div>

        <div style={{ ...rowStyle, borderBottom: 'none', paddingTop: '14px' }}>
          <span style={rowLabelStyle}>Tipo de simulador padrão</span>
          <SegmentControl
            options={SIMULATOR_OPTIONS}
            value={prefs?.default_simulator_type ?? 'pessimista'}
            onChange={(v) => handleChange({ default_simulator_type: v })}
            disabled={!prefs || saving}
            style={{ width: '240px' }}
          />
        </div>
      </div>

      {/* ── FORMATAÇÃO DE VALORES ──────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '22px',
      }}>
        <div style={sectionLabelStyle}>FORMATAÇÃO DE VALORES</div>

        <div style={{ ...rowStyle, paddingTop: '14px' }}>
          <div>
            <span style={rowLabelStyle}>Separador decimal</span>
            <div style={{
              fontSize: '11px', color: 'var(--muted2)', marginTop: '2px',
              fontFamily: 'Inter, sans-serif',
            }}>
              Afeta a exibição de preços e resultados financeiros
            </div>
          </div>
          <SegmentControl
            options={DECIMAL_OPTIONS}
            value={prefs?.decimal_separator ?? 'comma'}
            onChange={(v) => handleChange({ decimal_separator: v })}
            disabled={!prefs || saving}
            style={{ width: '200px' }}
          />
        </div>

        {/* Format preview */}
        <div style={{
          ...rowStyle,
          borderBottom: 'none',
          paddingTop: '12px',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
            Prévia
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text)',
          }}>
            {prefs ? formatPreview(prefs) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
