import { CalendarIcon, ClockIcon, MapPinIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'

import { getStatus } from '@/api/client'
import { CapacityBar } from '@/components/CapacityBar'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EventArtwork } from '@/components/EventArtwork'
import { ErrorState, Loading } from '@/components/Feedback'
import { PageHero } from '@/components/PageHero'
import { RegistrationForm } from '@/components/RegistrationForm'
import { RegistrationList } from '@/components/RegistrationList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useDeleteEvent, useEventQuery } from '@/hooks/useEvents'
import { categoryFor } from '@/lib/category'
import { formatDate, formatTime, isPast } from '@/lib/format'
import { useIsAuthenticated } from '@/store/authStore'

import { NotFoundPage } from './NotFoundPage'

/** One event: hero with key facts, artwork + description, attendees and the sign-up form. */
export function EventDetailPage() {
  const eventId = Number(useParams().id)
  const navigate = useNavigate()
  const isAuthenticated = useIsAuthenticated()
  const query = useEventQuery(eventId)
  const deleteEvent = useDeleteEvent()

  if (!Number.isInteger(eventId) || eventId <= 0) return <NotFoundPage />
  if (query.isPending) {
    return (
      <>
        <PageHero title="Loading…" crumbs={[{ label: 'Events', to: '/' }]} />
        <Loading label="Loading event…" />
      </>
    )
  }
  if (query.isError) {
    return getStatus(query.error) === 404 ? (
      <NotFoundPage message="This event does not exist or has been deleted." />
    ) : (
      <div className="mx-auto max-w-6xl px-4 pt-32">
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </div>
    )
  }

  const event = query.data
  const category = categoryFor(event.title)
  const isFull = event.available_spots === 0

  const facts = [
    { icon: CalendarIcon, label: formatDate(event.event_date) },
    { icon: ClockIcon, label: formatTime(event.event_date) },
    { icon: MapPinIcon, label: event.location },
  ]

  return (
    <>
      <PageHero title={event.title} crumbs={[{ label: 'Events', to: '/' }, { label: event.title }]}>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-navy-foreground/80">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold tracking-wide text-primary-foreground uppercase">
            {category.label}
          </span>
          {facts.map(({ icon: Icon, label }) => (
            <span key={label} className="flex min-w-0 items-center gap-1.5">
              <Icon className="size-4 shrink-0 text-brand-accent" aria-hidden />
              <span className="truncate">{label}</span>
            </span>
          ))}
          {isPast(event.event_date) && (
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase">Past event</span>
          )}
        </div>
      </PageHero>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-10 lg:grid-cols-3">
        <section className="flex min-w-0 flex-col gap-10 lg:col-span-2" aria-label="Event details">
          <Card className="overflow-hidden pt-0">
            <EventArtwork id={event.id} title={event.title} className="aspect-[16/7]" />
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-xl font-bold">About This Event</h2>
                {isAuthenticated && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="pill" asChild>
                      <Link to={`/events/${event.id}/edit`}>
                        <PencilIcon data-icon="inline-start" />
                        Edit
                      </Link>
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="destructive" size="pill" disabled={deleteEvent.isPending}>
                          <Trash2Icon data-icon="inline-start" />
                          Delete
                        </Button>
                      }
                      title="Delete This Event?"
                      description={`“${event.title}” and all ${event.registered_count} registrations will be permanently deleted.`}
                      confirmLabel="Delete Event"
                      onConfirm={() => deleteEvent.mutate(event.id, { onSuccess: () => navigate('/') })}
                    />
                  </div>
                )}
              </div>
              <p className="wrap-break-word whitespace-pre-line text-muted-foreground">
                {event.description || 'No description has been added yet.'}
              </p>
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <CapacityBar registered={event.registered_count} capacity={event.max_capacity} />
              </div>
            </CardFooter>
          </Card>

          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-bold">
              Attendees{' '}
              <span className="text-muted-foreground tabular-nums">({event.registered_count})</span>
            </h2>
            <RegistrationList eventId={event.id} />
          </div>
        </section>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <RegistrationForm eventId={event.id} isFull={isFull} />
        </aside>
      </div>
    </>
  )
}
