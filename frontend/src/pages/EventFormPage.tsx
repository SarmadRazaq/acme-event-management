import { useNavigate, useParams } from 'react-router'

import { getStatus } from '../api/client'
import { EventForm } from '../components/EventForm'
import { ErrorState, Spinner } from '../components/Feedback'
import { useCreateEvent, useEventQuery, useUpdateEvent } from '../hooks/useEvents'
import { NotFoundPage } from './NotFoundPage'

/** "New event" page (protected). */
export function CreateEventPage() {
  const navigate = useNavigate()
  const mutation = useCreateEvent()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Create an event</h1>
      <EventForm
        submitLabel="Create event"
        isSubmitting={mutation.isPending}
        error={mutation.error}
        onSubmit={(input) =>
          mutation.mutate(input, { onSuccess: (event) => navigate(`/events/${event.id}`) })
        }
        onCancel={() => navigate(-1)}
      />
    </div>
  )
}

/** "Edit event" page (protected). */
export function EditEventPage() {
  const eventId = Number(useParams().id)
  const navigate = useNavigate()
  const query = useEventQuery(eventId)
  const mutation = useUpdateEvent(eventId)

  if (query.isPending) return <Spinner label="Loading event…" />
  if (query.isError) {
    return getStatus(query.error) === 404 ? (
      <NotFoundPage message="This event does not exist." />
    ) : (
      <ErrorState error={query.error} />
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Edit “{query.data.title}”</h1>
      <EventForm
        // Re-mount the form if the cached event changes, so its default values stay in sync.
        key={query.data.updated_at}
        initial={query.data}
        submitLabel="Save changes"
        isSubmitting={mutation.isPending}
        error={mutation.error}
        onSubmit={(input) =>
          mutation.mutate(input, { onSuccess: () => navigate(`/events/${eventId}`) })
        }
        onCancel={() => navigate(`/events/${eventId}`)}
      />
    </div>
  )
}
