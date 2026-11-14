import { CalendarIcon, MapPinIcon } from 'lucide-react'
import { Link } from 'react-router'

import type { Event } from '@/api/types'
import { categoryFor } from '@/lib/category'
import { formatDate, isPast } from '@/lib/format'
import { cn } from '@/lib/utils'

import { EventArtwork } from './EventArtwork'

/** Image-led event card: artwork, category pill + date, title, location and seats left. */
export function EventCard({ event }: { event: Event }) {
  const category = categoryFor(event.title)
  const past = isPast(event.event_date)
  const full = event.available_spots === 0

  return (
    <article className="group relative flex flex-col gap-4">
      <EventArtwork
        id={event.id}
        title={event.title}
        className="aspect-[4/3] rounded-3xl shadow-lg shadow-navy/15 transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-primary/20 motion-reduce:transform-none"
      >
        <span
          className={cn(
            'absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase backdrop-blur tabular-nums',
            full ? 'bg-destructive text-white' : 'bg-white/90 text-navy',
          )}
        >
          {full
            ? 'Sold out'
            : `${event.available_spots} ${event.available_spots === 1 ? 'seat' : 'seats'} left`}
        </span>
        {past && (
          <span className="absolute top-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
            Past
          </span>
        )}
      </EventArtwork>

      <div className="flex flex-col gap-2 px-1">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="rounded-full bg-primary px-3 py-1 font-bold tracking-wide text-primary-foreground uppercase">
            {category.label}
          </span>
          <span className="flex items-center gap-1 font-medium text-muted-foreground">
            <CalendarIcon className="size-3.5" aria-hidden />
            {formatDate(event.event_date)}
          </span>
        </div>
        <h2 className="font-heading text-lg leading-snug font-bold wrap-break-word">
          {/* The link covers the whole card (::after), but only the title is read out. */}
          <Link
            to={`/events/${event.id}`}
            className="after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none group-hover:text-primary focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
          >
            {event.title}
          </Link>
        </h2>
        <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-brand-accent-ink">
          <MapPinIcon className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{event.location}</span>
        </p>
      </div>
    </article>
  )
}
