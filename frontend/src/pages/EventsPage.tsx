import { CalendarSearchIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { EventCard } from '@/components/EventCard'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { Pagination } from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useEventsQuery } from '@/hooks/useEvents'
import { cn } from '@/lib/utils'
import { useIsAuthenticated } from '@/store/authStore'

const PAGE_SIZE = 9

/**
 * Event browser. Filters and the current page live in the URL (?title=&date=&skip=), which
 * makes them shareable and bookmarkable. TanStack Query caches each combination.
 */
export function EventsPage() {
  const [params, setParams] = useSearchParams()
  const isAuthenticated = useIsAuthenticated()

  const title = params.get('title') ?? ''
  const date = params.get('date') ?? ''
  const skip = Math.max(0, Number(params.get('skip')) || 0)

  // When the URL changes from outside the box (back button, "Clear"), resync the draft.
  // Adjusting state during render is React's recommended alternative to a syncing effect.
  const [titleDraft, setTitleDraft] = useState(title)
  const [syncedTitle, setSyncedTitle] = useState(title)
  if (title !== syncedTitle) {
    setSyncedTitle(title)
    setTitleDraft(title)
  }

  const query = useEventsQuery({ skip, limit: PAGE_SIZE, title, date })

  // Merge changes into the *live* URL. React Router applies navigations inside a React
  // transition, so `params` (even the `prev` of a functional update) can lag one render
  // behind when two changes happen quickly, e.g. "Search" and then picking a date.
  // Reading window.location guarantees neither change overwrites the other.
  const updateParams = (changes: Record<string, string>) => {
    const next = new URLSearchParams(window.location.search)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next)
  }

  const applySearch = (event: FormEvent) => {
    event.preventDefault()
    updateParams({ title: titleDraft.trim(), skip: '' })
  }

  const hasFilters = Boolean(title || date)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-balance">Upcoming Events</h1>
          <p className="text-sm text-muted-foreground">
            Product launches, workshops, team-building and conferences at <span translate="no">Acme Corp</span>.
          </p>
        </div>
        {isAuthenticated && (
          <Button asChild>
            <Link to="/events/new">
              <PlusIcon data-icon="inline-start" />
              New Event
            </Link>
          </Button>
        )}
      </div>

      <Card className="py-4">
        <CardContent>
          <form onSubmit={applySearch} role="search" className="flex flex-wrap items-end gap-3">
            <Field className="min-w-48 flex-1">
              <FieldLabel htmlFor="search-title">Search by Title</FieldLabel>
              <Input
                id="search-title"
                type="search"
                placeholder="e.g. Python…"
                autoComplete="off"
                spellCheck={false}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
              />
            </Field>
            <Field className="w-auto">
              <FieldLabel htmlFor="search-date">Date</FieldLabel>
              <Input
                id="search-date"
                type="date"
                value={date}
                onChange={(e) => updateParams({ date: e.target.value, skip: '' })}
              />
            </Field>
            <Button type="submit">
              <SearchIcon data-icon="inline-start" />
              Search
            </Button>
            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTitleDraft('')
                  setParams(new URLSearchParams())
                }}
              >
                <XIcon data-icon="inline-start" />
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {query.isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading events">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.total === 0 ? (
        <EmptyState
          icon={CalendarSearchIcon}
          title={hasFilters ? 'No Events Match Your Filters' : 'No Events Yet'}
          description={
            hasFilters
              ? 'Try a different title or date.'
              : isAuthenticated
                ? 'Create the first one with “New Event”.'
                : 'Log in to create one.'
          }
        />
      ) : (
        <>
          <div
            className={cn(
              'grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3',
              query.isPlaceholderData && 'opacity-60',
            )}
          >
            {query.data.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <Pagination
            skip={skip}
            limit={PAGE_SIZE}
            total={query.data.total}
            onChange={(nextSkip) => updateParams({ skip: nextSkip ? String(nextSkip) : '' })}
          />
        </>
      )}
    </div>
  )
}
