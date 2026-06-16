/**
 * auth.test.ts — Vitest tests for the Zustand auth store (AUT-01..06)
 * All Supabase auth calls are mocked — no live HTTP calls.
 *
 * NOTE: vi.mock() is hoisted before variable declarations, so mock functions
 * must be defined inside the factory using vi.fn() directly.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── Mock supabase BEFORE importing the store ──────────────────────────────────
// Use vi.hoisted to safely define the fns before the hoisted vi.mock() runs.
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  signInWithOAuth: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  onAuthStateChange: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
      signOut: mocks.signOut,
      signInWithOAuth: mocks.signInWithOAuth,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      onAuthStateChange: mocks.onAuthStateChange,
    },
  },
}))

// Import store AFTER mock is set up
import { useAuthStore } from './auth'

const mockSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  user: { id: 'user-123', email: 'test@vetor.com' },
}

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: onAuthStateChange returns a no-op unsubscribe
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
    // Default: getSession returns null (not logged in)
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null })
    // Reset store state
    useAuthStore.setState({ session: null, user: null, loading: true })
  })

  it('initializes with loading=true, session=null, user=null', () => {
    const state = useAuthStore.getState()
    expect(state.loading).toBe(true)
    expect(state.session).toBeNull()
    expect(state.user).toBeNull()
  })

  it('init() calls getSession and onAuthStateChange', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })

    await useAuthStore.getState().init()

    expect(mocks.getSession).toHaveBeenCalledOnce()
    expect(mocks.onAuthStateChange).toHaveBeenCalledOnce()
  })

  it('init() sets session and user when session exists (AUT-02 rehydration)', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })

    await useAuthStore.getState().init()

    const state = useAuthStore.getState()
    expect(state.session).toEqual(mockSession)
    expect(state.user).toEqual(mockSession.user)
    expect(state.loading).toBe(false)
  })

  it('init() sets loading=false and session=null when no session', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null })

    await useAuthStore.getState().init()

    const state = useAuthStore.getState()
    expect(state.session).toBeNull()
    expect(state.loading).toBe(false)
  })

  it('signIn() calls signInWithPassword with email + password', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: mockSession, user: mockSession.user },
      error: null,
    })

    await useAuthStore.getState().signIn('test@vetor.com', 'secret')

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@vetor.com',
      password: 'secret',
    })
  })

  it('signIn() returns error when credentials wrong', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' },
    })

    const result = await useAuthStore.getState().signIn('bad@vetor.com', 'wrong')

    expect(result.error).toBeTruthy()
  })

  it('signUp() calls supabase.auth.signUp (AUT-01)', async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: { id: 'new-user', email: 'new@vetor.com' }, session: null },
      error: null,
    })

    await useAuthStore.getState().signUp('new@vetor.com', 'pass123')

    expect(mocks.signUp).toHaveBeenCalledWith({
      email: 'new@vetor.com',
      password: 'pass123',
    })
  })

  it('signOut() calls supabase.auth.signOut with scope local', async () => {
    mocks.signOut.mockResolvedValue({ error: null })

    await useAuthStore.getState().signOut()

    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('signOutGlobal() calls supabase.auth.signOut with scope global (AUT-04)', async () => {
    mocks.signOut.mockResolvedValue({ error: null })

    await useAuthStore.getState().signOutGlobal()

    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'global' })
  })

  it('signInWithOAuth() calls supabase.auth.signInWithOAuth with provider (AUT-06)', async () => {
    mocks.signInWithOAuth.mockResolvedValue({ data: {}, error: null })

    await useAuthStore.getState().signInWithOAuth('google')

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    )
  })

  it('onAuthStateChange updates session on SIGNED_IN event', async () => {
    let capturedCallback: ((event: string, session: unknown) => void) | null = null
    mocks.onAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
      capturedCallback = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    await useAuthStore.getState().init()

    // Simulate SIGNED_IN event
    capturedCallback!('SIGNED_IN', mockSession)

    const state = useAuthStore.getState()
    expect(state.session).toEqual(mockSession)
    expect(state.user).toEqual(mockSession.user)
  })

  it('onAuthStateChange clears session on SIGNED_OUT event', async () => {
    useAuthStore.setState({ session: mockSession as never, user: mockSession.user as never, loading: false })

    let capturedCallback: ((event: string, session: unknown) => void) | null = null
    mocks.onAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
      capturedCallback = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    await useAuthStore.getState().init()
    capturedCallback!('SIGNED_OUT', null)

    const state = useAuthStore.getState()
    expect(state.session).toBeNull()
    expect(state.user).toBeNull()
  })
})
