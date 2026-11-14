interface PaginationProps {
  skip: number
  limit: number
  total: number
  onChange: (skip: number) => void
}

/** Previous / next controls driven by the API's skip & limit. */
export function Pagination({ skip, limit, total, onChange }: PaginationProps) {
  if (total <= limit) return null

  const page = Math.floor(skip / limit) + 1
  const pages = Math.ceil(total / limit)
  const from = skip + 1
  const to = Math.min(skip + limit, total)

  return (
    <nav className="flex items-center justify-between gap-4 pt-2" aria-label="Pagination">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}</span>–
        <span className="font-medium text-slate-700">{to}</span> of{' '}
        <span className="font-medium text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(0, skip - limit))}
        >
          ← Previous
        </button>
        <span className="text-sm text-slate-500">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          className="btn-secondary"
          disabled={page >= pages}
          onClick={() => onChange(skip + limit)}
        >
          Next →
        </button>
      </div>
    </nav>
  )
}
