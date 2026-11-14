import { CircleAlertIcon, type LucideIcon, InboxIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { getErrorMessage } from '@/api/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'

/** Centered loading indicator with a visible label (announced by screen readers). */
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
      <Spinner aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  )
}

/** Friendly message for empty lists. */
export function EmptyState({
  title,
  description,
  icon: Icon = InboxIcon,
  action,
}: {
  title: string
  description?: ReactNode
  icon?: LucideIcon
  action?: ReactNode
}) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}

/** Error callout that shows the API's message (or a network error), with an optional retry. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>Something Went Wrong</AlertTitle>
      <AlertDescription>
        <p className="whitespace-pre-line">{getErrorMessage(error)}</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/** Inline form-level error (e.g. a 409 from the API), announced as an alert. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertDescription className="whitespace-pre-line">{getErrorMessage(error)}</AlertDescription>
    </Alert>
  )
}
