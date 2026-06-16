import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bot,
  BarChart2,
  User,
  Compass,
  Handshake,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react'
import { setTheme, getTheme } from '../../lib/theme'
import { useState } from 'react'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  badge?: number
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'PLATAFORMA',
    items: [
      {
        label: 'Robôs',
        path: '/robos',
        icon: <Bot size={16} strokeWidth={1.8} />,
      },
      {
        label: 'Backtests',
        path: '/backtests',
        icon: <BarChart2 size={16} strokeWidth={1.8} />,
      },
    ],
  },
  {
    label: 'DESCOBRIR',
    items: [],
  },
  {
    label: 'PARCEIRO',
    items: [],
  },
  {
    label: 'ADMINISTRAÇÃO',
    items: [],
  },
  {
    label: 'CONTA',
    items: [
      {
        label: 'Minha conta',
        path: '/conta',
        icon: <User size={16} strokeWidth={1.8} />,
      },
    ],
  },
]

// Icon map for group labels
const GROUP_ICONS: Record<string, React.ReactNode> = {
  DESCOBRIR: <Compass size={16} strokeWidth={1.8} />,
  PARCEIRO: <Handshake size={16} strokeWidth={1.8} />,
  ADMINISTRAÇÃO: <ShieldCheck size={16} strokeWidth={1.8} />,
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => getTheme().mode === 'dark')

  function isActive(path: string) {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  function handleThemeToggle() {
    const next = isDark ? 'light' : 'dark'
    setTheme({ mode: next })
    setIsDark(!isDark)
  }

  return (
    <aside
      style={{
        width: '236px',
        flex: '0 0 auto',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Logo area */}
      <div style={{ padding: '18px 16px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Logo mark */}
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '9px',
            background: 'var(--color-primary)',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '15px',
            color: 'var(--color-on-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          V
        </div>
        {/* Wordmark + subtitle */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '0.14em',
              color: 'var(--text)',
            }}
          >
            VETOR
          </div>
          <div
            style={{
              fontSize: '9.5px',
              color: 'var(--muted2)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginTop: '1px',
            }}
          >
            Robôs de trading
          </div>
        </div>
      </div>

      {/* Nav container */}
      <nav
        style={{
          padding: '6px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Section group label */}
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: 'var(--muted2)',
                padding: '10px 12px 6px',
                textTransform: 'uppercase',
              }}
            >
              {group.label}
            </div>

            {/* Nav items */}
            {group.items.length === 0 && GROUP_ICONS[group.label] && (
              <div
                style={{
                  borderRadius: '10px',
                  color: 'var(--muted2)',
                  padding: '6px 12px',
                  fontSize: '12px',
                  opacity: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                {GROUP_ICONS[group.label]}
                <span>Em breve</span>
              </div>
            )}

            {group.items.map((item) => {
              const active = isActive(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: active ? 'var(--tint-primary)' : 'transparent',
                    color: active ? 'var(--color-text-hi)' : 'var(--muted)',
                    boxShadow: active ? 'inset 3px 0 0 var(--color-primary)' : 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      fontSize: '13.5px',
                      fontWeight: 500,
                    }}
                  >
                    {item.icon}
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10.5px',
                          background: 'var(--tint-primary)',
                          color: 'var(--color-primary)',
                          borderRadius: '99px',
                          padding: '2px 8px',
                          fontWeight: 600,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar footer */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Theme toggle */}
        <button
          onClick={handleThemeToggle}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '12.5px',
            fontWeight: 500,
            color: 'var(--muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s',
          }}
        >
          {isDark ? <Sun size={14} strokeWidth={1.8} /> : <Moon size={14} strokeWidth={1.8} />}
          {isDark ? 'Modo claro' : 'Modo escuro'}
        </button>

        {/* User row placeholder */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '99px',
              background: 'var(--color-primary)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-on-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            U
          </div>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>
              Usuário
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--muted2)' }}>trader</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
