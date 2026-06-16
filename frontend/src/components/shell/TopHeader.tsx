import { useLocation } from 'react-router-dom'

/** Map of paths to page titles (Portuguese) */
const PAGE_TITLES: Record<string, string> = {
  '/robos': 'Meus Robôs',
  '/backtests': 'Backtests',
  '/conta': 'Minha conta',
}

function getPageTitle(pathname: string): string {
  if (pathname.includes('/parametros')) return 'Parâmetros'
  if (pathname.includes('/sumario')) return 'Sumário'
  return PAGE_TITLES[pathname] ?? 'Vetor'
}

/**
 * TopHeader — 62px bar with page title, live quote placeholder, and mode toggle.
 * Live quote and mode toggle are static placeholders — wired in later plans.
 */
export default function TopHeader() {
  const location = useLocation()
  const title = getPageTitle(location.pathname)

  return (
    <header
      style={{
        height: '62px',
        flex: '0 0 auto',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      {/* Page title */}
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '16px',
          color: 'var(--text)',
          margin: 0,
          flex: 1,
        }}
      >
        {title}
      </h1>

      {/* Live quote widget placeholder */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 12px',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          background: 'var(--surface2)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {/* Pulse dot */}
        <div
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '99px',
            background: 'var(--color-accent)',
            animation: 'pulseDot 2.2s infinite',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: '10px',
            color: 'var(--muted2)',
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
        >
          WDON26
        </span>
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>—</span>
      </div>

      {/* Mode toggle placeholder (MODO SIMULADO / MODO REAL) */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: '99px',
          padding: '4px',
        }}
      >
        {/* MODO SIMULADO — active by default */}
        <div
          className="ev-sim"
          style={{
            borderRadius: '99px',
            background: 'var(--tint-accent)',
            color: 'var(--color-accent)',
            padding: '6px 14px',
            fontSize: '10.5px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          MODO SIMULADO
        </div>
        {/* MODO REAL — inactive */}
        <div
          className="ev"
          style={{
            borderRadius: '99px',
            background: 'transparent',
            color: 'var(--muted2)',
            padding: '6px 14px',
            fontSize: '10.5px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          MODO REAL
        </div>
      </div>
    </header>
  )
}
