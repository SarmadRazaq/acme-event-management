/** Progress bar showing how full an event is. */
export function CapacityBar({ registered, capacity }: { registered: number; capacity: number }) {
  const percent = capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0
  const full = registered >= capacity
  const color = full ? 'bg-rose-500' : percent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>
          {registered} / {capacity} registered
        </span>
        <span className={full ? 'font-medium text-rose-600' : ''}>
          {full ? 'Full' : `${capacity - registered} spots left`}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={registered}
        aria-valuemin={0}
        aria-valuemax={capacity}
      >
        <div className={`h-full ${color} transition-all`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
