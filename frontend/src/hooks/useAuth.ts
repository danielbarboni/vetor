/**
 * useAuth.ts — Convenience hook that selects auth state from the Zustand store.
 *
 * Usage:
 *   const { session, user, loading, signIn, signOut } = useAuth()
 */
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  return useAuthStore((state) => ({
    session: state.session,
    user: state.user,
    loading: state.loading,
    signIn: state.signIn,
    signUp: state.signUp,
    signOut: state.signOut,
    signOutGlobal: state.signOutGlobal,
    signInWithOAuth: state.signInWithOAuth,
    resetPassword: state.resetPassword,
    init: state.init,
  }))
}
