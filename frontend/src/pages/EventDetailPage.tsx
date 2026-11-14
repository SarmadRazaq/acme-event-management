import { ArrowLeftIcon, CalendarIcon, MapPinIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'

import { getStatus } from '@/api/client'
import { CapacityBar } from '@/components/CapacityBar'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorState, Loading } from '@/components/Feedback'
import { RegistrationForm } from '@/components/RegistrationForm'
import { RegistrationList } from '@/components/RegistrationList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useDeleteEvent, useEventQuery } from '@/hooks/useEvents'
import { formatDateTime, isPast } from '@/lib/format'
import { useIsAuthenticated } from '@/store/authStore'

import { NotFoundPage } from './NotFoundPage'

/** One event: details, capacity, registration form and attendee list. */
export function EventDetailPage() {
  const eventId = Number(useParams().id)
  const navigate = useNavigate()
  const isAuthenticated = useIsAuthenticated()
  const query = useEventQuery(eventId)
  const deleteEvent = useDeleteEvent()

  if (!Number.isInteger(eventId) || eventId <= 0) return <NotFoundPage />
  if (query.isPending) return <Loading label="Loading event…" />
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
    <div className="flex flex-col gap-6">
      <Button variant="link" asChild className="self-start px-0">
        <Link to="/">
          <ArrowLeftIcon data-icon="inline-start" />
          All Events
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="flex min-w-0 flex-col gap-8 lg:col-span-2" aria-labelledby="event-title">
          <Card>
            <CardHeader>
              <CardTitle>
                <h1 id="event-title" className="text-2xl font-bold tracking-tight break-words text-balance">
                  {event.title}
                </h1>
              </CardTitle>
              {isAuthenticated && (
                <CardAction className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link to={`/events/${event.id}/edit`}>
                      <PencilIcon data-icon="inline-start" />
                      Edit
                    </Link>
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button variant="destructive" disabled={deleteEvent.isPending}>
                        <Trash2Icon data-icon="inline-start" />
                        Delete
                      </Button>
                    }
                    title="Delete This Event?"
                    description={`“${event.title}” and all ${event.registered_count} registrations will be permanently deleted.`}
                    confirmLabel="Delete Event"
                    onConfirm={() => deleteEvent.mutate(event.id, { onSuccess: () => navigate('/') })}
                  />
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarIcon className="size-3.5" aria-hidden />
                    When
                  </dt>
                  <dd className="flex flex-wrap items-center gap-2 font-medium">
                    {formatDateTime(event.event_date)}
                    {isPast(event.event_date) && <Badge variant="secondary">Past</Badge>}
                  </dd>
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPinIcon className="size-3.5" aria-hidden />
                    Where
                  </dt>
                  <dd className="font-medium break-words">{event.location}</dd>
                </div>
              </dl>
              {event.description && (
                <>
                  <Separator />
                  <p className="break-words whitespace-pre-line text-muted-foreground">{event.description}</p>
                </>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <CapacityBar registered={event.registered_count} capacity={event.max_capacity} />
              </div>
            </CardFooter>
          </Card>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">
              Attendees{' '}
              <span className="text-muted-foreground tabular-nums">({event.registered_count})</span>
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
