/**
 * RequireAuth.test.tsx — Vitest tests for the RequireAuth route guard.
 * Mocks the auth store to test redirect + render behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock the auth store
const mockUseAuthStore = vi.fn()

vi.mock('@/stores/auth', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => mockUseAuthStore(selector),
}))

import RequireAuth from './RequireAuth'

const mockSession = {
  access_token: 'test-token',
  user: { id: 'user-123', email: 'test@vetor.com' },
}

function renderWithRouter(authState: { session: unknown; loading: boolean }) {
  mockUseAuthStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector(authState)
  )

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/auth/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children when session is present', () => {
    renderWithRouter({ session: mockSession, loading: false })
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to /auth/login when session is null', () => {
    renderWithRouter({ session: null, loading: false })
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders nothing while loading (no redirect yet)', () => {
    renderWithRouter({ session: null, loading: true })
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })
})
