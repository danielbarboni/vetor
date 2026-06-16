/**
 * AuthLayout.tsx — Centered layout for all auth screens.
 *
 * Uses the full-bleed radial background gradient from the design system
 * (identical to the app shell but without sidebar/header).
 */
import { type ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background radial gradient — matches shell design */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(900px 420px at 70% -10%, var(--glow1), transparent 60%),' +
            'radial-gradient(700px 420px at 8% 112%, var(--glow2), transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Card container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '400px',
          padding: '0 16px',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '32px',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '9px',
              background: 'var(--color-primary, #8F7BFF)',
              fontFamily: 'Sora, sans-serif',
              fontWeight: 800,
              fontSize: '15px',
              color: 'var(--seg-on-tx, #14182B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            V
          </div>
          <span
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '0.14em',
              color: 'var(--text)',
            }}
          >
            VETOR
          </span>
        </div>

        {/* Auth card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: 'var(--shadow)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
