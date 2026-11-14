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
 * Light page header: a soft pale-blue to peach wash that fades into the page, with a large
 * title and a breadcrumb trail. The floating navigation pill (see Layout) sits on top of it.
 */
export function PageHero({ title, crumbs = [], children, size = 'default' }: PageHeroProps) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden text-foreground',
        size === 'lg' ? 'pt-40 pb-28' : 'pt-36 pb-16',
      )}
    >
      {/* Soft colour wash: blue from the top-left, peach from the right, fading into the page. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: [
            'radial-gradient(55% 90% at 12% 0%, var(--wash-from), transparent 70%)',
            'radial-gradient(45% 80% at 92% 10%, var(--wash-to), transparent 70%)',
            'linear-gradient(180deg, color-mix(in oklch, var(--wash-from) 45%, transparent), transparent)',
          ].join(','),
        }}
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-balance wrap-break-word sm:text-5xl">
          {title}
        </h1>
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <li>
              <Link to="/" className="hover:text-foreground">
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
                  <Link to={crumb.to} className="truncate hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="max-w-[40ch] truncate text-primary">{crumb.label}</span>
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
