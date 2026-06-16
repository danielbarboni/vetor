/**
 * AuthCallback.tsx — OAuth redirect handler.
 *
 * After Supabase redirects back to /auth/callback, the onAuthStateChange
 * listener in the auth store automatically picks up the session.
 * This component waits for the session to populate, then navigates
 * to /auth/select (account selector) or /robos.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

export default function AuthCallback() {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)

  useEffect(() => {
    if (!loading) {
      if (session) {
        navigate('/auth/select', { replace: true })
      } else {
        // Auth failed — go back to login
        navigate('/auth/login', { replace: true })
      }
    }
  }, [session, loading, navigate])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {/* Spinner */}
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--seg-on, #8F7BFF)',
            borderRadius: '99px',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>Autenticando...</p>
      </div>
    </div>
  )
}
