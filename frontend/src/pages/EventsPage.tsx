import { type FormEvent, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { EventCard } from '../components/EventCard'
import { EmptyState, ErrorState, Spinner } from '../components/Feedback'
import { Pagination } from '../components/Pagination'
import { useEventsQuery } from '../hooks/useEvents'
import { useIsAuthenticated } from '../store/authStore'

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

  // Local draft of the search box; only applied to the URL when the form is submitted.
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upcoming events</h1>
          <p className="text-sm text-slate-500">
            Product launches, workshops, team-building and conferences at Acme Corp.
          </p>
        </div>
        {isAuthenticated && (
          <Link to="/events/new" className="btn-primary">
            + New event
          </Link>
        )}
      </div>

      <form onSubmit={applySearch} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-48 flex-1">
          <label htmlFor="search-title" className="label">
            Search by title
          </label>
          <input
            id="search-title"
            type="search"
            className="input"
            placeholder="e.g. Python"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="search-date" className="label">
            Date
          </label>
          <input
            id="search-date"
            type="date"
            className="input"
            value={date}
            onChange={(e) => updateParams({ date: e.target.value, skip: '' })}
          />
        </div>
        <button type="submit" className="btn-primary">
          Search
        </button>
        {hasFilters && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setTitleDraft('')
              setParams(new URLSearchParams())
            }}
          >
            Clear
          </button>
        )}
      </form>

      {query.isPending ? (
        <Spinner label="Loading events…" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.total === 0 ? (
        <EmptyState title={hasFilters ? 'No events match your filters' : 'No events yet'}>
          {hasFilters
            ? 'Try a different title or date.'
            : isAuthenticated
              ? 'Create the first one with “New event”.'
              : 'Log in to create one.'}
        </EmptyState>
      ) : (
        <>
          <div
            className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${query.isPlaceholderData ? 'opacity-60' : ''}`}
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
