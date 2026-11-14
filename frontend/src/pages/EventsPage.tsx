import { CalendarSearchIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { EventCard } from '@/components/EventCard'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { PageHero } from '@/components/PageHero'
import { Pagination } from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <>
      <PageHero title="Upcoming Events" crumbs={[{ label: 'Events' }]} size="lg">
        <p className="max-w-xl text-navy-foreground/75">
          Product launches, workshops, team-building and conferences at{' '}
          <span translate="no">Acme Corp</span>. Find one and save your seat.
        </p>
        {isAuthenticated && (
          <Button variant="gradient" size="pill" asChild className="mt-2 self-start">
            <Link to="/events/new">
              <PlusIcon data-icon="inline-start" />
              New Event
            </Link>
          </Button>
        )}
      </PageHero>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        {/* Search bar overlapping the bottom of the hero */}
        <form
          onSubmit={applySearch}
          role="search"
          className="relative z-10 -mt-10 flex flex-col gap-3 rounded-3xl bg-card p-3 shadow-xl shadow-navy/10 ring-1 ring-border sm:flex-row sm:items-center sm:rounded-full sm:pl-6"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <Label htmlFor="search-title" className="sr-only">
              Search by Title
            </Label>
            <Input
              id="search-title"
              type="search"
              placeholder="Search events by title…"
              autoComplete="off"
              spellCheck={false}
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="search-date" className="sr-only">
              Date
            </Label>
            <Input
              id="search-date"
              type="date"
              className="h-10 w-auto rounded-full"
              value={date}
              onChange={(e) => updateParams({ date: e.target.value, skip: '' })}
            />
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="rounded-full"
                aria-label="Clear filters"
                onClick={() => {
                  setTitleDraft('')
                  setParams(new URLSearchParams())
                }}
              >
                <XIcon />
              </Button>
            )}
            <Button type="submit" variant="gradient" size="pill">
              Search
            </Button>
          </div>
        </form>

        {query.isPending ? (
          <div
            className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
            aria-busy="true"
            aria-label="Loading events"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="aspect-[4/3] rounded-3xl" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-3/4" />
              </div>
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
                'grid gap-x-6 gap-y-10 transition-opacity sm:grid-cols-2 lg:grid-cols-3',
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
    </>
  )
}
