import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

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
    <nav className="flex flex-wrap items-center justify-between gap-4 pt-2" aria-label="Pagination">
      <p className="text-sm text-muted-foreground tabular-nums">
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(0, skip - limit))}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums" aria-current="page">
          Page {page} of {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onChange(skip + limit)}
        >
          Next
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </nav>
  )
}
