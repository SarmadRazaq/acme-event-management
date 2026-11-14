/**
 * The single TanStack Query client shared by the whole app, plus the query-key factory.
 *
 * Keeping all query keys in one place makes cache invalidation predictable: after a mutation
 * we invalidate e.g. `queryKeys.events.all` and every events query refetches.
 */
import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import type { EventFilters } from '../api/types'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      // Retry network hiccups, but never retry 4xx errors such as 404 – they will not fix themselves.
      retry: (failureCount, error) => {
        if (isAxiosError(error) && error.response && error.response.status < 500) return false
        return failureCount < 2
      },
    },
  },
})

export const queryKeys = {
  events: {
    all: ['events'] as const,
    lists: ['events', 'list'] as const,
    list: (filters: EventFilters) => ['events', 'list', filters] as const,
    detail: (id: number) => ['events', 'detail', id] as const,
    registrations: (id: number, skip: number, limit: number) =>
      ['events', 'detail', id, 'registrations', { skip, limit }] as const,
  },
  me: ['auth', 'me'] as const,
}
