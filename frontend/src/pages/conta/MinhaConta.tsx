/**
 * MinhaConta.tsx — /conta route (CTR-01..04)
 *
 * Page heading: "Minha conta"
 * Tab bar: PERFIL | CORRETORAS | PREFERÊNCIAS | ÚLTIMOS ACESSOS
 * (ASSINATURAS tab is Phase 2 — omitted)
 *
 * Tabs use .et / .et-on classes from Editor tab pattern (UI-SPEC § Editor Shell):
 *   padding: 8px 2px 12px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.07em
 *   Active: color --text; box-shadow: inset 0 -2px 0 --color-primary
 *   Inactive: color --muted; box-shadow: none
 *
 * Container: max-width 920px; padding 22px 28px 80px (UI-SPEC § Minha Conta)
 */
import { useState } from 'react'
import PerfilTab from '@/components/conta/PerfilTab'
import CorretorasTab from '@/components/conta/CorretorasTab'
import PreferenciasTab from '@/components/conta/PreferenciasTab'
import UltimosAcessosTab from '@/components/conta/UltimosAcessosTab'

type TabId = 'perfil' | 'corretoras' | 'preferencias' | 'ultimos-acessos'

const TABS: { id: TabId; label: string }[] = [
  { id: 'perfil', label: 'PERFIL' },
  { id: 'corretoras', label: 'CORRETORAS' },
  { id: 'preferencias', label: 'PREFERÊNCIAS' },
  { id: 'ultimos-acessos', label: 'ÚLTIMOS ACESSOS' },
]

export default function MinhaConta() {
  const [activeTab, setActiveTab] = useState<TabId>('perfil')

  return (
    <div style={{
      maxWidth: '920px',
      padding: '22px 28px 80px',
      animation: 'fadeUp 0.25s ease',
    }}>

      {/* Page heading */}
      <h1 style={{
        fontFamily: "'Sora', sans-serif",
        fontWeight: 700,
        fontSize: '18px',
        color: 'var(--text)',
        margin: 0,
      }}>
        Minha conta
      </h1>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: '22px',
        borderBottom: '1px solid var(--border)',
        marginTop: '14px',
      }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={active ? 'et-on' : 'et'}
              style={{
                padding: '8px 2px 12px',
                fontSize: '11.5px',
                fontWeight: 700,
                letterSpacing: '0.07em',
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                fontFamily: 'Inter, sans-serif',
                color: active ? 'var(--text)' : 'var(--muted)',
                boxShadow: active ? 'inset 0 -2px 0 var(--color-primary)' : 'none',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'perfil' && <PerfilTab />}
      {activeTab === 'corretoras' && <CorretorasTab />}
      {activeTab === 'preferencias' && <PreferenciasTab />}
      {activeTab === 'ultimos-acessos' && <UltimosAcessosTab />}
    </div>
  )
}
