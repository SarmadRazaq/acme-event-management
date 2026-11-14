import { UsersIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCancelRegistration, useRegistrationsQuery } from '@/hooks/useEvents'
import { formatDateTime } from '@/lib/format'
import { useIsAuthenticated } from '@/store/authStore'

import { ConfirmDialog } from './ConfirmDialog'
import { EmptyState, ErrorState } from './Feedback'
import { Pagination } from './Pagination'

const PAGE_SIZE = 10

/** Paginated attendee list. Logged-in users can cancel registrations. */
export function RegistrationList({ eventId }: { eventId: number }) {
  const [skip, setSkip] = useState(0)
  const query = useRegistrationsQuery(eventId, skip, PAGE_SIZE)
  const cancel = useCancelRegistration(eventId)
  const canCancel = useIsAuthenticated()

  if (query.isPending) {
    return (
      <Card className="gap-0 divide-y py-0" aria-busy="true" aria-label="Loading attendees">
        {[0, 1, 2].map((key) => (
          <div key={key} className="flex flex-col gap-2 px-5 py-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        ))}
      </Card>
    )
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />

  const { items, total } = query.data
  if (total === 0) {
    return <EmptyState icon={UsersIcon} title="No Registrations Yet" description="Be the first to sign up!" />
  }

  return (
    <div className="flex flex-col gap-3">
      <Card className="gap-0 py-0">
        <ul className="divide-y">
          {items.map((registration) => (
            <li key={registration.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="flex min-w-0 items-center gap-2 font-medium">
                  <span className="truncate">{registration.employee_name}</span>
                  {registration.department && (
                    <Badge variant="secondary" className="shrink-0">
                      {registration.department}
                    </Badge>
                  )}
                </p>
                <p className="truncate text-sm text-muted-foreground">{registration.employee_email}</p>
                <p className="text-xs text-muted-foreground">
                  Registered {formatDateTime(registration.created_at)}
                </p>
              </div>
              {canCancel && (
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-destructive"
                      disabled={cancel.isPending}
                    >
                      <XIcon data-icon="inline-start" />
                      Cancel
                    </Button>
                  }
                  title="Cancel This Registration?"
                  description={`${registration.employee_name} will lose their seat, and someone else can take it.`}
                  confirmLabel="Cancel Registration"
                  onConfirm={() => cancel.mutate(registration.id)}
                />
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Pagination skip={skip} limit={PAGE_SIZE} total={total} onChange={setSkip} />
    </div>
  )
}
