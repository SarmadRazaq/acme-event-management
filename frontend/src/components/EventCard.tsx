import { CalendarIcon, MapPinIcon } from 'lucide-react'
import { Link } from 'react-router'

import type { Event } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, isPast } from '@/lib/format'

import { CapacityBar } from './CapacityBar'

/** Summary card for one event in the events grid. The whole card is a single link. */
export function EventCard({ event }: { event: Event }) {
  const past = isPast(event.event_date)
  const full = event.available_spots === 0

  return (
    <Link
      to={`/events/${event.id}`}
      className="group rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Card className="h-full transition-[box-shadow,transform] group-hover:-translate-y-0.5 group-hover:shadow-md motion-reduce:transform-none">
        <CardHeader>
          <CardTitle className="text-base break-words group-hover:text-primary">
            <h2>{event.title}</h2>
          </CardTitle>
          <CardDescription className="flex flex-col gap-1">
            <span className="flex items-center gap-2">
              <CalendarIcon className="size-3.5 shrink-0" aria-hidden />
              {formatDateTime(event.event_date)}
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <MapPinIcon className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{event.location}</span>
            </span>
          </CardDescription>
          {(past || full) && (
            <div className="flex gap-1.5">
              {past && <Badge variant="secondary">Past</Badge>}
              {full && <Badge variant="destructive">Full</Badge>}
            </div>
          )}
        </CardHeader>
        {event.description && (
          <CardContent>
            <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
          </CardContent>
        )}
        <CardFooter className="mt-auto">
          <div className="w-full">
            <CapacityBar registered={event.registered_count} capacity={event.max_capacity} />
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
