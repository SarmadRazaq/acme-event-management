/**
 * Thin, typed wrappers around each REST endpoint. Components never call Axios directly;
 * they go through the TanStack Query hooks in `src/hooks`, which call these functions.
 */
import { api } from './client'
import type {
  Event,
  EventFilters,
  EventInput,
  Page,
  Registration,
  RegistrationInput,
  Token,
  User,
} from './types'

// --------------------------------------------------------------------------- auth

export async function login(email: string, password: string): Promise<Token> {
  // The login endpoint follows the OAuth2 password flow, which expects form data.
  const form = new URLSearchParams({ username: email, password })
  const { data } = await api.post<Token>('/auth/login', form)
  return data
}

export async function signup(input: {
  email: string
  full_name: string
  password: string
}): Promise<User> {
  const { data } = await api.post<User>('/auth/register', input)
  return data
}

export async function fetchMe(token?: string): Promise<User> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined
  const { data } = await api.get<User>('/auth/me', { headers })
  return data
}

// --------------------------------------------------------------------------- events

export async function fetchEvents(filters: EventFilters): Promise<Page<Event>> {
  // Drop empty filters so the URL stays clean (e.g. no "?title=").
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  )
  const { data } = await api.get<Page<Event>>('/events', { params })
  return data
}

export async function fetchEvent(id: number): Promise<Event> {
  const { data } = await api.get<Event>(`/events/${id}`)
  return data
}

export async function createEvent(input: EventInput): Promise<Event> {
  const { data } = await api.post<Event>('/events', input)
  return data
}

export async function updateEvent(id: number, input: Partial<EventInput>): Promise<Event> {
  const { data } = await api.put<Event>(`/events/${id}`, input)
  return data
}

export async function deleteEvent(id: number): Promise<void> {
  await api.delete(`/events/${id}`)
}

// --------------------------------------------------------------------------- registrations

export async function fetchRegistrations(
  eventId: number,
  skip: number,
  limit: number,
): Promise<Page<Registration>> {
  const { data } = await api.get<Page<Registration>>(`/events/${eventId}/registrations`, {
    params: { skip, limit },
  })
  return data
}

export async function registerForEvent(
  eventId: number,
  input: RegistrationInput,
): Promise<Registration> {
  const { data } = await api.post<Registration>(`/events/${eventId}/registrations`, input)
  return data
}

export async function cancelRegistration(id: number): Promise<void> {
  await api.delete(`/registrations/${id}`)
}
