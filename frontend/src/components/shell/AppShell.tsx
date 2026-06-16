import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopHeader from './TopHeader'

/**
 * AppShell — fixed full-viewport three-layer layout.
 *
 * z0: background radial-gradient overlay (pointer-events:none, position:absolute)
 * z3: Sidebar (236px, left)
 * z1: main column (flex:1) containing:
 *   z2: TopHeader (62px)
 *   main: scrollable content area with <Outlet/>
 *
 * font-size:14px is set on this outermost div (not on body).
 */
export default function AppShell() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'row',
        fontSize: '14px',
        background: 'var(--bg)',
      }}
    >
      {/* z0: Background radial gradient overlay — ambient glow on every screen */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(900px 420px at 70% -10%, var(--glow1), transparent 60%), radial-gradient(700px 420px at 8% 112%, var(--glow2), transparent 60%)',
        }}
      />

      {/* z3: Sidebar */}
      <Sidebar />

      {/* z1: Main column */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
          position: 'relative',
        }}
      >
        {/* z2: Top Header */}
        <TopHeader />

        {/* Scrollable screen content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            animation: 'fadeUp 0.25s ease',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
