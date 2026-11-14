import { categoryFor } from '@/lib/category'
import { cn } from '@/lib/utils'

/**
 * Generated "stage lights" artwork for an event. The API stores no images, so each event
 * gets a deterministic illustration: the category picks the colours and icon, and the
 * event id shifts the spotlights so neighbouring cards look different.
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
  const x1 = 15 + ((id * 37) % 40)
  const x2 = 55 + ((id * 53) % 35)

  return (
    <div
      aria-hidden
      className={cn('relative isolate overflow-hidden bg-navy', className)}
      style={{
        backgroundImage: [
          // Two coloured spotlights from above…
          `radial-gradient(60% 80% at ${x1}% 0%, oklch(0.62 0.24 ${a} / 0.85), transparent 70%)`,
          `radial-gradient(55% 75% at ${x2}% 0%, oklch(0.66 0.22 ${b} / 0.7), transparent 70%)`,
          // …a warm glow on the "stage"…
          `radial-gradient(70% 45% at 50% 105%, oklch(0.55 0.2 ${a} / 0.75), transparent 75%)`,
          // …and a dark vignette.
          'linear-gradient(180deg, oklch(0.18 0.06 278 / 0.1), oklch(0.12 0.05 278 / 0.7))',
        ].join(','),
      }}
    >
      {/* Light beams */}
      <div
        className="absolute inset-0 opacity-30 mix-blend-screen"
        style={{
          backgroundImage: `conic-gradient(from 160deg at ${x1}% -10%, transparent 0deg, white 8deg, transparent 18deg), conic-gradient(from 175deg at ${x2}% -10%, transparent 0deg, white 6deg, transparent 14deg)`,
        }}
      />
      {/* Dotted "crowd" texture */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 opacity-25"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1.5px)',
          backgroundSize: '12px 12px',
          maskImage: 'linear-gradient(to top, black, transparent)',
        }}
      />
      <Icon className="absolute top-1/2 left-1/2 size-14 -translate-x-1/2 -translate-y-1/2 text-white/85 drop-shadow-[0_4px_24px_rgba(255,255,255,0.35)]" />
      {children}
    </div>
  )
}
