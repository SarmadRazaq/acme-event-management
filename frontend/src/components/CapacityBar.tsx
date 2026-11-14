import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

/** Shows how full an event is, as numbers and a progress bar. */
export function CapacityBar({ registered, capacity }: { registered: number; capacity: number }) {
  const percent = capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0
  const full = registered >= capacity
  const left = Math.max(capacity - registered, 0)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>
          {registered} / {capacity} registered
        </span>
        <span className={cn(full && 'font-medium text-destructive')}>
          {full ? 'Full' : `${left} ${left === 1 ? 'spot' : 'spots'} left`}
        </span>
      </div>
      <Progress
        value={percent}
        aria-label={`${registered} of ${capacity} seats taken`}
        className={cn(full && '[&>[data-slot=progress-indicator]]:bg-destructive')}
      />
    </div>
  )
}
