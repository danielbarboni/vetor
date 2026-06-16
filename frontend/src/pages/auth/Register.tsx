/**
 * Register.tsx — Auth screen: Criar conta (AUT-01)
 *
 * Exact PT-BR copy from UI-SPEC Authentication table.
 * On success: shows email verification banner (AUT-01).
 */
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import { useAuthStore } from '@/stores/auth'

function mapSignUpError(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes('already registered') || msg.includes('user already exists') || msg.includes('email already')) {
    // UI-SPEC: "Este email já está cadastrado. Faça login ou recupere a senha."
    return 'Este email já está cadastrado. Faça login ou recupere a senha.'
  }
  return 'Erro ao criar conta. Tente novamente.'
}

export default function Register() {
  const signUp = useAuthStore((s) => s.signUp)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: authError } = await signUp(email, password)
    setLoading(false)
    if (authError) {
      setError(mapSignUpError(authError.message))
    } else {
      // Show email verification banner — UI-SPEC: "Verifique seu email para ativar a conta."
      setVerified(true)
    }
  }

  if (verified) {
    return (
      <AuthLayout>
        <div style={{ textAlign: 'center' }}>
          {/* Verification icon */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '99px',
              background: 'rgba(143,123,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--seg-on)" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <h2
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: '18px',
              color: 'var(--text)',
              margin: '0 0 8px',
            }}
          >
            Verifique seu email
          </h2>

          {/* UI-SPEC verification banner */}
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
            Verifique seu email para ativar a conta.
          </p>

          <p style={{ fontSize: '12.5px', color: 'var(--muted2)', margin: '0 0 20px' }}>
            Enviamos um link de confirmação para{' '}
            <strong style={{ color: 'var(--muted)' }}>{email}</strong>.
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
      {/* Heading — UI-SPEC: "Criar conta" */}
      <h1
        style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          fontSize: '20px',
          color: 'var(--text)',
          margin: '0 0 8px',
        }}
      >
        Criar conta
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 24px' }}>
        Crie sua conta para começar a operar com robôs.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label
            htmlFor="register-email"
            style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}
          >
            Email
          </label>
          <input
            id="register-email"
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
        <div>
          <label
            htmlFor="register-password"
            style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}
          >
            Senha
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="mínimo 6 caracteres"
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

        {/* CTA — UI-SPEC: "Criar conta" */}
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
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      {/* Login link */}
      <p
        style={{
          textAlign: 'center',
          fontSize: '12.5px',
          color: 'var(--muted)',
          marginTop: '20px',
          marginBottom: 0,
        }}
      >
        Já tem conta?{' '}
        <Link
          to="/auth/login"
          style={{ color: 'var(--seg-on)', textDecoration: 'none', fontWeight: 500 }}
        >
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
