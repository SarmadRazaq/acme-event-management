import { Link } from 'react-router'

import type { Event } from '../api/types'
import { formatDateTime, isPast } from '../lib/format'
import { CapacityBar } from './CapacityBar'

/** Summary card for one event in the events grid. */
export function EventCard({ event }: { event: Event }) {
  const past = isPast(event.event_date)

  return (
    <Link
      to={`/events/${event.id}`}
      className="card group flex flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{event.title}</h3>
        {past && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            Past
          </span>
        )}
      </div>

      <dl className="space-y-1 text-sm text-slate-600">
        <div className="flex gap-2">
          <dt className="sr-only">Date</dt>
          <span aria-hidden>📅</span>
          <dd>{formatDateTime(event.event_date)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="sr-only">Location</dt>
          <span aria-hidden>📍</span>
          <dd>{event.location}</dd>
        </div>
      </dl>

      {event.description && (
        <p className="line-clamp-2 text-sm text-slate-500">{event.description}</p>
      )}

      <div className="mt-auto">
        <CapacityBar registered={event.registered_count} capacity={event.max_capacity} />
      </div>
    </Link>
  )
}
