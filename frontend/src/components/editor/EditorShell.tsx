/**
 * EditorShell — header bar with breadcrumb, robot name, last-saved timestamp,
 * and the SUMÁRIO / GRÁFICO / PARÂMETROS tab strip.
 *
 * UI-SPEC:
 *   Editor header: padding:20px 28px 0; border-bottom:1px solid --border; background:--surface
 *   Tabs (.et): padding:8px 2px 13px; font-size:12px; font-weight:700; letter-spacing:0.08em;
 *               color:--muted; cursor:pointer
 *   Active (.et-on): color:--text; box-shadow:inset 0 -2px 0 var(--color-primary)
 *   Robot name: Sora 19px w700 --text
 *   Breadcrumb: JBMono 11px --muted
 *   Last saved: JBMono 11px --muted
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export type EditorTab = 'sumario' | 'grafico' | 'parametros'

interface EditorShellProps {
  robotName: string
  paramsSavedAt: string | null
  activeTab: EditorTab
  onTabChange: (tab: EditorTab) => void
  children: React.ReactNode
}

const TABS: { id: EditorTab; label: string }[] = [
  { id: 'sumario', label: 'SUMÁRIO' },
  { id: 'grafico', label: 'GRÁFICO' },
  { id: 'parametros', label: 'PARÂMETROS' },
]

function formatSavedAt(iso: string | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`
  } catch {
    return '—'
  }
}

export default function EditorShell({
  robotName,
  paramsSavedAt,
  activeTab,
  onTabChange,
  children,
}: EditorShellProps) {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '20px 28px 0',
        flexShrink: 0,
      }}>
        {/* Breadcrumb + last saved */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '10px',
        }}>
          <button
            onClick={() => navigate('/robos')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              color: 'var(--muted)',
              padding: 0,
            }}
          >
            Robôs
          </button>
          <ChevronRight size={12} strokeWidth={1.8} color="var(--muted2)" />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            color: 'var(--muted)',
          }}>
            {robotName}
          </span>
          <div style={{ flex: 1 }} />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            color: 'var(--muted)',
            letterSpacing: '0.04em',
          }}>
            ÚLTIMO SALVAR: {formatSavedAt(paramsSavedAt)}
          </span>
        </div>

        {/* Robot name */}
        <h1 style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: '19px',
          fontWeight: 700,
          color: 'var(--text)',
          margin: '0 0 14px 0',
        }}>
          {robotName}
        </h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '20px' }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px 2px 13px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  color: isActive ? 'var(--text)' : 'var(--muted)',
                  boxShadow: isActive ? 'inset 0 -2px 0 var(--color-primary)' : 'none',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.15s',
                  textTransform: 'uppercase',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '22px 92px 80px 28px', // 92px right for action rail
      }}>
        {children}
      </div>
    </div>
  )
}
