import { categoryFor } from '@/lib/category'
import { cn } from '@/lib/utils'

/**
 * Generated pastel artwork for an event. The API stores no images, so each event gets a
 * deterministic illustration: the category picks the colours and icon, and the event id
 * moves the colour blobs so neighbouring cards look different.
 */
export function EventArtwork({
  id,
  title,
  className,
  children,
}: {
  id: number
  title: string
  className?: string
  children?: React.ReactNode
}) {
  const { icon: Icon, hues } = categoryFor(title)
  const [a, b] = hues
  // Cheap deterministic pseudo-random positions from the id.
  const x1 = 10 + ((id * 37) % 35)
  const x2 = 60 + ((id * 53) % 30)
  const y2 = 55 + ((id * 29) % 40)

  return (
    <div
      aria-hidden
      className={cn('relative isolate overflow-hidden', className)}
      style={{
        backgroundColor: `oklch(0.95 0.03 ${a})`,
        backgroundImage: [
          // Two soft colour blobs…
          `radial-gradient(60% 70% at ${x1}% 15%, oklch(0.84 0.11 ${a} / 0.95), transparent 70%)`,
          `radial-gradient(55% 65% at ${x2}% ${y2}%, oklch(0.87 0.1 ${b} / 0.9), transparent 70%)`,
          // …and a light sheen across the top.
          'linear-gradient(160deg, oklch(1 0 0 / 0.55), transparent 45%)',
        ].join(','),
      }}
    >
      {/* Subtle dotted texture */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 0.9) 1px, transparent 1.5px)',
          backgroundSize: '14px 14px',
          maskImage: 'linear-gradient(to bottom, transparent, black)',
        }}
      />
      {/* Category icon on a frosted disc */}
      <span className="absolute top-1/2 left-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/70 shadow-lg shadow-black/5 ring-1 ring-white backdrop-blur">
        <Icon className="size-9" style={{ color: `oklch(0.45 0.16 ${a})` }} />
      </span>
      {children}
    </div>
  )
}
