/**
 * TanStack Query hooks for events and registrations (server state).
 *
 * Queries cache data per query key; mutations invalidate the affected keys afterwards so
 * the UI always shows fresh numbers (e.g. "available spots" after someone registers).
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getErrorMessage } from '../api/client'
import * as endpoints from '../api/endpoints'
import type { EventFilters, EventInput, RegistrationInput } from '../api/types'
import { queryKeys } from '../lib/queryClient'

// --------------------------------------------------------------------------- queries

export function useEventsQuery(filters: EventFilters) {
  return useQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: () => endpoints.fetchEvents(filters),
    // Keep showing the current page while the next one loads (no flicker when paginating).
    placeholderData: keepPreviousData,
  })
}

export function useEventQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => endpoints.fetchEvent(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

export function useRegistrationsQuery(eventId: number, skip: number, limit: number) {
  return useQuery({
    queryKey: queryKeys.events.registrations(eventId, skip, limit),
    queryFn: () => endpoints.fetchRegistrations(eventId, skip, limit),
    placeholderData: keepPreviousData,
  })
}

// --------------------------------------------------------------------------- mutations

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EventInput) => endpoints.createEvent(input),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
      toast.success(`Event "${event.title}" created.`)
    },
  })
}

export function useUpdateEvent(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<EventInput>) => endpoints.updateEvent(id, input),
    onSuccess: (event) => {
      // Put the fresh event straight into the cache, then refresh any lists.
      queryClient.setQueryData(queryKeys.events.detail(id), event)
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
      toast.success('Event updated.')
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => endpoints.deleteEvent(id),
    onSuccess: () => {
      // Refresh only the lists. The deleted event's own cache entry is left alone (it is
      // garbage-collected once the detail page unmounts); removing it now would make the
      // still-mounted page refetch an event that no longer exists.
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists })
      toast.success('Event deleted.')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useRegisterForEvent(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RegistrationInput) => endpoints.registerForEvent(eventId, input),
    onSuccess: (registration) => {
      // Invalidating the detail key also refreshes its nested registrations queries.
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
      toast.success(`${registration.employee_name} is registered!`)
    },
  })
}

export function useCancelRegistration(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (registrationId: number) => endpoints.cancelRegistration(registrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
      toast.success('Registration cancelled.')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}
