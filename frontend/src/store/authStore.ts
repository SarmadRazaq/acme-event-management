/**
 * Client-side authentication state (Zustand).
 *
 * Only *client* state lives here: the JWT and the logged-in user. Everything that comes
 * from the server (events, registrations) is cached by TanStack Query instead, so the two
 * kinds of state never get out of sync.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { User } from '../api/types'

interface AuthState {
  token: string | null
  user: User | null
  /** Store a fresh session after logging in. */
  setSession: (token: string, user: User) => void
  /** Forget the session (logout or expired token). */
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    {
      // Persist to localStorage so a page refresh keeps the user logged in.
      name: 'acme-events-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)

/** Convenience selector: is someone logged in? */
export const useIsAuthenticated = () => useAuthStore((state) => state.token !== null)
