/**
 * Authentication hooks: they combine API calls (TanStack Query mutations) with the
 * Zustand auth store (client state).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import * as endpoints from '../api/endpoints'
import { useAuthStore } from '../store/authStore'

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { access_token } = await endpoints.login(email, password)
      // Load the profile with the brand-new token before storing the session.
      const user = await endpoints.fetchMe(access_token)
      return { token: access_token, user }
    },
    onSuccess: ({ token, user }) => {
      setSession(token, user)
      toast.success(`Logged in as ${user.full_name}.`)
    },
  })
}

export function useSignup() {
  const login = useLogin()
  return useMutation({
    mutationFn: async (input: { email: string; full_name: string; password: string }) => {
      await endpoints.signup(input)
      // Log straight in after a successful sign-up.
      return login.mutateAsync({ email: input.email, password: input.password })
    },
  })
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession)
  const queryClient = useQueryClient()
  return () => {
    clearSession()
    // Drop every cached response so nothing from the old session lingers.
    queryClient.clear()
    toast('You have been logged out.')
  }
}
