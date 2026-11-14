import { useNavigate, useParams } from 'react-router'

import { getStatus } from '@/api/client'
import { EventForm } from '@/components/EventForm'
import { ErrorState, Loading } from '@/components/Feedback'
import { PageHero } from '@/components/PageHero'
import { useCreateEvent, useEventQuery, useUpdateEvent } from '@/hooks/useEvents'

import { NotFoundPage } from './NotFoundPage'

/** "New event" page (protected). */
export function CreateEventPage() {
  const navigate = useNavigate()
  const mutation = useCreateEvent()

  return (
    <>
      <PageHero title="Create an Event" crumbs={[{ label: 'Events', to: '/' }, { label: 'New Event' }]} />
      <div className="mx-auto max-w-2xl px-4 pt-10">
        <EventForm
          submitLabel="Create Event"
          isSubmitting={mutation.isPending}
          error={mutation.error}
          onSubmit={(input) =>
            mutation.mutate(input, { onSuccess: (event) => navigate(`/events/${event.id}`) })
          }
          onCancel={() => navigate(-1)}
        />
      </div>
    </>
  )
}

/** "Edit event" page (protected). */
export function EditEventPage() {
  const eventId = Number(useParams().id)
  const navigate = useNavigate()
  const query = useEventQuery(eventId)
  const mutation = useUpdateEvent(eventId)

  if (query.isPending) {
    return (
      <>
        <PageHero title="Edit Event" crumbs={[{ label: 'Events', to: '/' }, { label: 'Edit' }]} />
        <Loading label="Loading event…" />
      </>
    )
  }
  if (query.isError) {
    return getStatus(query.error) === 404 ? (
      <NotFoundPage message="This event does not exist." />
    ) : (
      <div className="mx-auto max-w-2xl px-4 pt-32">
        <ErrorState error={query.error} />
      </div>
    )
  }

  return (
    <>
      <PageHero
        title={`Edit “${query.data.title}”`}
        crumbs={[
          { label: 'Events', to: '/' },
          { label: query.data.title, to: `/events/${eventId}` },
          { label: 'Edit' },
        ]}
      />
      <div className="mx-auto max-w-2xl px-4 pt-10">
        <EventForm
          // Re-mount the form if the cached event changes, so its default values stay in sync.
          key={query.data.updated_at}
          initial={query.data}
          submitLabel="Save Changes"
          isSubmitting={mutation.isPending}
          error={mutation.error}
          onSubmit={(input) =>
            mutation.mutate(input, { onSuccess: () => navigate(`/events/${eventId}`) })
          }
          onCancel={() => navigate(`/events/${eventId}`)}
        />
      </div>
    </>
  )
}
