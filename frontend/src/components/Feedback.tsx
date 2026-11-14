import type { ReactNode } from 'react'

import { getErrorMessage } from '../api/client'

/** Small animated loading indicator. */
export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

/** Friendly message for empty lists. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      {children && <div className="text-sm text-slate-500">{children}</div>}
    </div>
  )
}

/** Error box that shows the API's message (or a network error). */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
      <p className="font-medium">Something went wrong</p>
      <p className="mt-1 whitespace-pre-line text-sm">{getErrorMessage(error)}</p>
      {onRetry && (
        <button type="button" className="btn-secondary mt-3" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

/** Inline form-level error (e.g. a 409 from the API). */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <p role="alert" className="whitespace-pre-line rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
      {getErrorMessage(error)}
    </p>
  )
}
