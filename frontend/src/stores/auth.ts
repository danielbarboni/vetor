/**
 * auth.ts — Zustand auth store
 *
 * State:   { session, user, loading }
 * Actions: init, signIn, signUp, signOut, signOutGlobal (AUT-04), signInWithOAuth (AUT-06)
 *
 * On init():
 *   1. Calls supabase.auth.getSession() to rehydrate from storage (AUT-02 persistence).
 *   2. Registers onAuthStateChange to keep session fresh on token refresh / sign-out.
 *
 * All API callers read `session.access_token` for Authorization: Bearer headers.
 */
import { create } from 'zustand'
import { type Session, type User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
}

interface AuthActions {
  /** Rehydrate session from storage + register onAuthStateChange listener. Call once on app mount. */
  init: () => Promise<void>
  /** Sign in with email + password. Returns { error } on failure. */
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  /** Sign up with email + password (AUT-01). Returns { error } on failure. */
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  /** Sign out from this device only. */
  signOut: () => Promise<void>
  /** Sign out from ALL devices (AUT-04 global sign-out). */
  signOutGlobal: () => Promise<void>
  /** Initiate OAuth login with Google or GitHub (AUT-06). */
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: Error | null }>
  /** Request password-reset email (AUT-03). */
  resetPassword: (email: string) => Promise<{ error: Error | null }>
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // ── Initial state ────────────────────────────────────────────────────────────
  session: null,
  user: null,
  loading: true,

  // ── init ─────────────────────────────────────────────────────────────────────
  init: async () => {
    const { data } = await supabase.auth.getSession()
    set({
      session: data.session,
      user: data.session?.user ?? null,
      loading: false,
    })

    // Keep session fresh: token refresh, sign-in from another tab, sign-out
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        loading: false,
      })
    })
  },

  // ── signIn ───────────────────────────────────────────────────────────────────
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.session) {
      set({ session: data.session, user: data.user, loading: false })
    }
    return { error: error as Error | null }
  },

  // ── signUp ───────────────────────────────────────────────────────────────────
  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error as Error | null }
  },

  // ── signOut (local) ──────────────────────────────────────────────────────────
  signOut: async () => {
    await supabase.auth.signOut({ scope: 'local' })
    set({ session: null, user: null, loading: false })
  },

  // ── signOutGlobal (AUT-04) ───────────────────────────────────────────────────
  signOutGlobal: async () => {
    await supabase.auth.signOut({ scope: 'global' })
    set({ session: null, user: null, loading: false })
  },

  // ── signInWithOAuth (AUT-06) ─────────────────────────────────────────────────
  signInWithOAuth: async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error as Error | null }
  },

  // ── resetPassword (AUT-03) ───────────────────────────────────────────────────
  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    return { error: error as Error | null }
  },
}))
