/**
 * RequireAuth.tsx — Route guard component.
 *
 * - While auth is loading: renders nothing (spinner-free; prevents flash).
 * - When session is absent: redirects to /auth/login (replaces history entry).
 * - When session is present: renders <Outlet /> (the protected child route).
 */
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

export default function RequireAuth() {
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)

  if (loading) {
    // Auth is still rehydrating — render nothing to avoid flash of login page.
    return null
  }

  if (!session) {
    return <Navigate to="/auth/login" replace />
  }

  return <Outlet />
}
