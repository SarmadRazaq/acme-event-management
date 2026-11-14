/**
 * Pre-configured Axios instance used by every API call.
 *
 * - attaches the JWT from the Zustand store to each request
 * - logs the user out automatically if the API answers 401 (expired or invalid token)
 * - `getErrorMessage` turns FastAPI error bodies into readable text for the UI
 */
import axios, { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { queryClient } from '../lib/queryClient'
import { useAuthStore } from '../store/authStore'

export const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({ baseURL: API_URL, timeout: 15_000 })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = Boolean(useAuthStore.getState().token)
    const isLogin = error.config?.url?.includes('/auth/login')
    if (isAxiosError(error) && error.response?.status === 401 && hadToken && !isLogin) {
      useAuthStore.getState().clearSession()
      queryClient.removeQueries({ queryKey: ['auth'] })
      toast.error('Your session has expired. Please log in again.')
    }
    return Promise.reject(error)
  },
)

interface ValidationIssue {
  loc: (string | number)[]
  msg: string
}

/** Extract a human-friendly message from any error thrown by an API call. */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    // 422 errors: FastAPI returns a list of issues, one per invalid field.
    if (Array.isArray(detail)) {
      return (detail as ValidationIssue[])
        .map((issue) => `${issue.loc.filter((part) => part !== 'body').join('.')}: ${issue.msg}`)
        .join('\n')
    }
    if (!error.response) return 'Cannot reach the server. Is the API running?'
    return `Request failed (${error.response.status}).`
  }
  return error instanceof Error ? error.message : 'Something went wrong.'
}

/** HTTP status of an API error, if there is one. */
export const getStatus = (error: unknown): number | undefined =>
  isAxiosError(error) ? error.response?.status : undefined
