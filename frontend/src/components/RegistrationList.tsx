import { useState } from 'react'

import { useCancelRegistration, useRegistrationsQuery } from '../hooks/useEvents'
import { formatDateTime } from '../lib/format'
import { useIsAuthenticated } from '../store/authStore'
import { EmptyState, ErrorState, Spinner } from './Feedback'
import { Pagination } from './Pagination'

const PAGE_SIZE = 10

/** Paginated attendee list. Logged-in users can cancel registrations. */
export function RegistrationList({ eventId }: { eventId: number }) {
  const [skip, setSkip] = useState(0)
  const query = useRegistrationsQuery(eventId, skip, PAGE_SIZE)
  const cancel = useCancelRegistration(eventId)
  const canCancel = useIsAuthenticated()
  // Two-step "Cancel → Confirm" instead of a blocking browser confirm() dialog.
  const [confirmId, setConfirmId] = useState<number | null>(null)

  if (query.isPending) return <Spinner label="Loading attendees…" />
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />

  const { items, total } = query.data
  if (total === 0) {
    return <EmptyState title="No registrations yet">Be the first to sign up!</EmptyState>
  }

  return (
    <div className="space-y-3">
      <ul className="card divide-y divide-slate-100">
        {items.map((registration) => (
          <li key={registration.id} className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">{registration.employee_name}</p>
              <p className="truncate text-sm text-slate-500">
                {registration.employee_email}
                {registration.department && ` · ${registration.department}`}
              </p>
              <p className="text-xs text-slate-400">
                Registered {formatDateTime(registration.created_at)}
              </p>
            </div>
            {canCancel &&
              (confirmId === registration.id ? (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="btn-danger px-3 py-1.5"
                    disabled={cancel.isPending}
                    onClick={() =>
                      cancel.mutate(registration.id, { onSettled: () => setConfirmId(null) })
                    }
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="btn-secondary px-3 py-1.5"
                    onClick={() => setConfirmId(null)}
                  >
                    Keep
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-secondary shrink-0 px-3 py-1.5 text-rose-600"
                  onClick={() => setConfirmId(registration.id)}
                >
                  Cancel
                </button>
              ))}
          </li>
        ))}
      </ul>
      <Pagination skip={skip} limit={PAGE_SIZE} total={total} onChange={setSkip} />
    </div>
  )
}
