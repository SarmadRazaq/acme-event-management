/**
 * TypeScript mirrors of the API's Pydantic schemas (see backend/app/schemas.py).
 */

export interface User {
  id: number
  email: string
  full_name: string
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface Event {
  id: number
  title: string
  description: string | null
  event_date: string
  location: string
  max_capacity: number
  created_by_id: number | null
  registered_count: number
  available_spots: number
  created_at: string
  updated_at: string
}

export interface EventInput {
  title: string
  description: string | null
  event_date: string
  location: string
  max_capacity: number
}

export interface Registration {
  id: number
  event_id: number
  employee_name: string
  employee_email: string
  department: string | null
  created_at: string
}

export interface RegistrationInput {
  employee_name: string
  employee_email: string
  department?: string | null
}

/** Paginated list envelope returned by every list endpoint. */
export interface Page<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

export interface EventFilters {
  skip: number
  limit: number
  title?: string
  date?: string
}
