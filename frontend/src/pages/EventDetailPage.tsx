import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { getStatus } from '../api/client'
import { CapacityBar } from '../components/CapacityBar'
import { ErrorState, Spinner } from '../components/Feedback'
import { RegistrationForm } from '../components/RegistrationForm'
import { RegistrationList } from '../components/RegistrationList'
import { useDeleteEvent, useEventQuery } from '../hooks/useEvents'
import { formatDateTime } from '../lib/format'
import { useIsAuthenticated } from '../store/authStore'
import { NotFoundPage } from './NotFoundPage'

/** One event: details, capacity, registration form and attendee list. */
export function EventDetailPage() {
  const eventId = Number(useParams().id)
  const navigate = useNavigate()
  const isAuthenticated = useIsAuthenticated()
  const query = useEventQuery(eventId)
  const deleteEvent = useDeleteEvent()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!Number.isInteger(eventId) || eventId <= 0) return <NotFoundPage />
  if (query.isPending) return <Spinner label="Loading event…" />
  if (query.isError) {
    return getStatus(query.error) === 404 ? (
      <NotFoundPage message="This event does not exist or has been deleted." />
    ) : (
      <ErrorState error={query.error} onRetry={() => query.refetch()} />
    )
  }

  const event = query.data
  const isFull = event.available_spots === 0

  return (
    <div className="space-y-8">
      <Link to="/" className="text-sm text-brand-600 hover:underline">
        ← All events
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <div className="card space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
              {isAuthenticated && (
                <div className="flex gap-2">
                  <Link to={`/events/${event.id}/edit`} className="btn-secondary">
                    Edit
                  </Link>
                  {confirmDelete ? (
                    <>
                      <button
                        type="button"
                        className="btn-danger"
                        disabled={deleteEvent.isPending}
                        onClick={() =>
                          deleteEvent.mutate(event.id, { onSuccess: () => navigate('/') })
                        }
                      >
                        {deleteEvent.isPending ? 'Deleting…' : 'Confirm delete'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setConfirmDelete(false)}
                      >
                        Keep
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary text-rose-600"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>

            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">When</dt>
                <dd className="font-medium text-slate-900">{formatDateTime(event.event_date)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Where</dt>
                <dd className="font-medium text-slate-900">{event.location}</dd>
              </div>
            </dl>

            {event.description && (
              <p className="whitespace-pre-line text-slate-600">{event.description}</p>
            )}

            <CapacityBar registered={event.registered_count} capacity={event.max_capacity} />
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Attendees <span className="text-slate-400">({event.registered_count})</span>
            </h2>
            <RegistrationList eventId={event.id} />
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <RegistrationForm eventId={event.id} isFull={isFull} />
        </aside>
      </div>
    </div>
  )
}
