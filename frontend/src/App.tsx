import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/shell/AppShell'

// Route stub pages — each will be implemented in later plans
function AuthStub() {
  return (
    <div style={{ padding: '22px 28px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)' }}>
        Autenticação
      </h1>
    </div>
  )
}

function RobosStub() {
  return (
    <div style={{ padding: '22px 28px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)' }}>
        Meus Robôs
      </h1>
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
  return (
    <Routes>
      {/* Auth routes — outside the app shell */}
      <Route path="/auth/*" element={<AuthStub />} />

      {/* App shell wraps all authenticated routes */}
      <Route element={<AppShell />}>
        <Route path="/robos" element={<RobosStub />} />
        <Route path="/robos/:id/parametros" element={<RoboParametrosStub />} />
        <Route path="/robos/:id/sumario" element={<RoboSumarioStub />} />
        <Route path="/backtests" element={<BacktestsStub />} />
        <Route path="/conta" element={<ContaStub />} />
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/robos" replace />} />
        <Route path="*" element={<Navigate to="/robos" replace />} />
      </Route>
    </Routes>
  )
}
