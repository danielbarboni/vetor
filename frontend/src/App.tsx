import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/shell/AppShell'
import RequireAuth from './components/auth/RequireAuth'
import { useAuthStore } from './stores/auth'

// Robot listing
import RobotList from './pages/robots/RobotList'

// Auth screens
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import AuthCallback from './pages/auth/AuthCallback'
import AccountSelector from './pages/auth/AccountSelector'

// Route stub pages — each will be implemented in later plans
function RobosWizardStub() {
  return (
    <div style={{ padding: '22px 28px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)' }}>
        Criar Robô
      </h1>
      <p style={{ color: 'var(--muted)', marginTop: '8px' }}>
        Wizard — implementado no plano 01-07
      </p>
    </div>
  )
}

function RoboParametrosStub() {
  return (
    <div style={{ padding: '22px 28px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)' }}>
        Parâmetros do Robô
      </h1>
    </div>
  )
}

function RoboSumarioStub() {
  return (
    <div style={{ padding: '22px 28px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)' }}>
        Sumário do Robô
      </h1>
    </div>
  )
}

function BacktestsStub() {
  return (
    <div style={{ padding: '22px 28px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)' }}>
        Backtests
      </h1>
    </div>
  )
}

function ContaStub() {
  return (
    <div style={{ padding: '22px 28px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)' }}>
        Minha Conta
      </h1>
    </div>
  )
}

export default function App() {
  const init = useAuthStore((s) => s.init)

  // Rehydrate session once on app mount (AUT-02 persistence)
  useEffect(() => {
    init()
  }, [init])

  return (
    <Routes>
      {/* Public auth routes — outside the app shell + RequireAuth */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/forgot" element={<ForgotPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/select" element={<AccountSelector />} />

      {/* Protected app shell wraps all authenticated routes */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/robos" element={<RobotList />} />
          <Route path="/robos/wizard" element={<RobosWizardStub />} />
          <Route path="/robos/:id/parametros" element={<RoboParametrosStub />} />
          <Route path="/robos/:id/sumario" element={<RoboSumarioStub />} />
          <Route path="/backtests" element={<BacktestsStub />} />
          <Route path="/conta" element={<ContaStub />} />
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/robos" replace />} />
          <Route path="*" element={<Navigate to="/robos" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
