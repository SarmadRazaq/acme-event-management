import { ChevronRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  to?: string
}

interface PageHeroProps {
  title: ReactNode
  /** Breadcrumb trail after "Home". */
  crumbs?: Crumb[]
  /** Extra content under the title (e.g. date and location of an event). */
  children?: ReactNode
  /** Taller hero with more breathing room (used on the events page). */
  size?: 'default' | 'lg'
}

/**
 * Dark navy page header with spotlight glows, a large title and a breadcrumb trail.
 * The floating navigation pill (see Layout) sits on top of it.
 */
export function PageHero({ title, crumbs = [], children, size = 'default' }: PageHeroProps) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden bg-navy text-navy-foreground',
        size === 'lg' ? 'pt-40 pb-28' : 'pt-36 pb-16',
      )}
    >
      {/* Spotlights */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: [
            'radial-gradient(40% 70% at 85% 0%, oklch(0.6 0.2 255 / 0.6), transparent 70%)',
            'radial-gradient(35% 60% at 10% 10%, oklch(0.75 0.14 55 / 0.3), transparent 70%)',
            'radial-gradient(60% 50% at 50% 120%, oklch(0.45 0.17 258 / 0.6), transparent 70%)',
          ].join(','),
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1.5px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-balance wrap-break-word sm:text-5xl">
          {title}
        </h1>
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold tracking-wider text-navy-foreground/70 uppercase">
            <li>
              <Link to="/" className="hover:text-white">
                Home
              </Link>
            </li>
            {crumbs.map((crumb, index) => (
              <li
                key={crumb.label}
                aria-current={index === crumbs.length - 1 ? 'page' : undefined}
                className="flex min-w-0 items-center gap-1.5"
              >
                <ChevronRightIcon className="size-3.5 shrink-0" aria-hidden />
                {crumb.to ? (
                  <Link to={crumb.to} className="truncate hover:text-white">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="max-w-[40ch] truncate text-brand-accent">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        {children}
      </div>
    </section>
  )
}
