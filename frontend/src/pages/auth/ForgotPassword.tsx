/**
 * ForgotPassword.tsx — Auth screen: Recuperar senha (AUT-03)
 *
 * Exact PT-BR copy from UI-SPEC Authentication table.
 * CTA "Enviar link" → supabase.auth.resetPasswordForEmail (via store.resetPassword)
 * Success: "Enviamos um link para [email]. Verifique sua caixa de entrada."
 */
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import { useAuthStore } from '@/stores/auth'

export default function ForgotPassword() {
  const resetPassword = useAuthStore((s) => s.resetPassword)

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: authError } = await resetPassword(email)
    setLoading(false)
    if (authError) {
      setError('Não foi possível enviar o link. Verifique o email e tente novamente.')
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '99px',
              background: 'rgba(62,230,200,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent, #3EE6C8)" strokeWidth="1.8" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: '18px',
              color: 'var(--text)',
              margin: '0 0 12px',
            }}
          >
            Link enviado!
          </h2>

          {/* UI-SPEC success message: "Enviamos um link para [email]. Verifique sua caixa de entrada." */}
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
            Enviamos um link para <strong style={{ color: 'var(--text)' }}>{email}</strong>. Verifique sua caixa de entrada.
          </p>

          <Link
            to="/auth/login"
            style={{
              display: 'inline-block',
              padding: '9px 24px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text)',
              fontSize: '13.5px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Voltar para login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      {/* Heading — UI-SPEC: "Recuperar senha" */}
      <h1
        style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          fontSize: '20px',
          color: 'var(--text)',
          margin: '0 0 8px',
        }}
      >
        Recuperar senha
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 24px' }}>
        Informe seu email e enviaremos um link para redefinir a senha.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label
            htmlFor="forgot-email"
            style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}
          >
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="seu@email.com"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '9px 12px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text)',
              fontSize: '13.5px',
              outline: 'none',
            }}
          />
        </div>

        {/* Error message */}
        {error && (
          <p
            style={{
              fontSize: '12.5px',
              color: 'var(--color-loss, #FF6B6B)',
              margin: 0,
              padding: '8px 12px',
              background: 'rgba(255,107,107,0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255,107,107,0.2)',
            }}
          >
            {error}
          </p>
        )}

        {/* CTA — UI-SPEC: "Enviar link" */}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '9px 16px',
            background: 'var(--seg-on, #8F7BFF)',
            color: 'var(--seg-on-tx, #14182B)',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.15s',
            marginTop: '4px',
          }}
        >
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>

      {/* Back to login */}
      <p
        style={{
          textAlign: 'center',
          fontSize: '12.5px',
          color: 'var(--muted)',
          marginTop: '20px',
          marginBottom: 0,
        }}
      >
        <Link
          to="/auth/login"
          style={{ color: 'var(--seg-on)', textDecoration: 'none', fontWeight: 500 }}
        >
          ← Voltar para login
        </Link>
      </p>
    </AuthLayout>
  )
}
