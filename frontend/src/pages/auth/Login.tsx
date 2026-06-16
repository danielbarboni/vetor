/**
 * Login.tsx — Auth screen: Entrar na Vetor (AUT-02, AUT-06)
 *
 * Exact PT-BR copy from UI-SPEC Authentication table.
 */
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import { useAuthStore } from '@/stores/auth'

// Error code mapping → PT-BR copy (UI-SPEC)
function mapAuthError(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Email ou senha incorretos.'
  }
  if (msg.includes('user not found') || msg.includes('no user')) {
    return 'Conta não encontrada. Verifique o email ou crie uma conta.'
  }
  return 'Email ou senha incorretos.'
}

export default function Login() {
  const navigate = useNavigate()
  const signIn = useAuthStore((s) => s.signIn)
  const signInWithOAuth = useAuthStore((s) => s.signInWithOAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: authError } = await signIn(email, password)
    setLoading(false)
    if (authError) {
      setError(mapAuthError(authError.message))
    } else {
      navigate('/auth/select')
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setError(null)
    const { error: authError } = await signInWithOAuth(provider)
    if (authError) {
      setError('Erro ao iniciar autenticação. Tente novamente.')
    }
  }

  return (
    <AuthLayout>
      {/* Heading — UI-SPEC: "Entrar na Vetor" */}
      <h1
        style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          fontSize: '20px',
          color: 'var(--text)',
          margin: '0 0 8px',
        }}
      >
        Entrar na Vetor
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 24px' }}>
        Acesse sua conta para continuar.
      </p>

      {/* OAuth buttons — UI-SPEC: "Entrar com Google" / "Entrar com GitHub" */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 16px',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            background: 'var(--surface2)',
            color: 'var(--text)',
            fontSize: '13.5px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
        >
          <GoogleIcon />
          Entrar com Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('github')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 16px',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            background: 'var(--surface2)',
            color: 'var(--text)',
            fontSize: '13.5px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
        >
          <GitHubIcon />
          Entrar com GitHub
        </button>
      </div>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        <span style={{ fontSize: '12px', color: 'var(--muted2)' }}>ou</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      {/* Email/password form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label
            htmlFor="login-email"
            style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}
          >
            Email
          </label>
          <input
            id="login-email"
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label
              htmlFor="login-password"
              style={{ fontSize: '12px', color: 'var(--muted)' }}
            >
              Senha
            </label>
            <Link
              to="/auth/forgot"
              style={{ fontSize: '12px', color: 'var(--seg-on)', textDecoration: 'none' }}
            >
              Esqueci a senha
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
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

        {/* CTA — UI-SPEC: "Entrar" */}
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
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {/* Register link */}
      <p
        style={{
          textAlign: 'center',
          fontSize: '12.5px',
          color: 'var(--muted)',
          marginTop: '20px',
          marginBottom: 0,
        }}
      >
        Não tem conta?{' '}
        <Link
          to="/auth/register"
          style={{ color: 'var(--seg-on)', textDecoration: 'none', fontWeight: 500 }}
        >
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}

// ── Icon components ────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}
