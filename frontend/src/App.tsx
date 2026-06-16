import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/shell/AppShell'
import RequireAuth from './components/auth/RequireAuth'
import { useAuthStore } from './stores/auth'

// Robot listing
import RobotList from './pages/robots/RobotList'

// Robot wizard
import RobotWizard from './pages/robots/RobotWizard'

// Robot editor (plan 08)
import RobotEditor from './pages/robots/RobotEditor'

// Minha Conta (plan 13)
import MinhaConta from './pages/conta/MinhaConta'

// Auth screens
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import AuthCallback from './pages/auth/AuthCallback'
import AccountSelector from './pages/auth/AccountSelector'

// Route stub pages — each will be implemented in later plans

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
          <Route path="/robos/wizard" element={<RobotWizard />} />
          <Route path="/robos/:id/parametros" element={<RobotEditor />} />
          <Route path="/robos/:id/sumario" element={<RoboSumarioStub />} />
          <Route path="/backtests" element={<BacktestsStub />} />
          <Route path="/conta" element={<MinhaConta />} />
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/robos" replace />} />
          <Route path="*" element={<Navigate to="/robos" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
