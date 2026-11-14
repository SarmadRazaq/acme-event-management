import { ArrowRightIcon, LogOutIcon, SparklesIcon } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'

import { Button } from '@/components/ui/button'
import { useLogout } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useApplyTheme } from '@/store/themeStore'

import { ThemeToggle } from './ThemeToggle'

// Evaluated once at module load (keeps render pure).
const CURRENT_YEAR = new Date().getFullYear()

/** Brand mark: gradient badge + wordmark. */
function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2 font-heading text-lg font-extrabold', className)} translate="no">
      <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-primary to-brand-accent text-white shadow-md shadow-primary/30">
        <SparklesIcon className="size-4.5" aria-hidden />
      </span>
      Acme Events
    </span>
  )
}

/**
 * App shell, styled like an event site: a floating white navigation pill over each page's
 * dark hero, the page on a light "sheet" with rounded bottom corners, and a navy footer.
 */
export function Layout() {
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()
  useApplyTheme()

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
      isActive ? 'text-primary' : 'text-foreground/70 hover:text-foreground',
    )

  return (
    <div className="flex min-h-svh flex-col bg-navy">
      {/* Keyboard users can jump straight past the navigation. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      <header className="absolute inset-x-0 top-4 z-20 px-4">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 rounded-full bg-background/95 py-2 pr-2 pl-5 shadow-xl shadow-black/20 backdrop-blur">
          <Link to="/" aria-label="Acme Events home">
            <Logo />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={navClass}>
              Events
            </NavLink>
            {user && (
              <NavLink to="/events/new" className={navClass}>
                New Event
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {user ? (
              <>
                <span className="hidden max-w-40 truncate px-2 text-sm font-medium text-muted-foreground lg:inline" title={user.email}>
                  {user.full_name}
                </span>
                <Button variant="outline" size="pill" onClick={logout}>
                  <LogOutIcon data-icon="inline-start" />
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="pill" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button variant="gradient" size="pill" asChild className="hidden sm:inline-flex">
                  <Link to="/signup">
                    Sign Up
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="flex-1 overflow-hidden rounded-b-[2.5rem] bg-background pb-16 outline-none"
      >
        <Outlet />
      </main>

      <SiteFooter signedIn={Boolean(user)} />
    </div>
  )
}

/** Navy footer with a call-to-action band and link columns. */
function SiteFooter({ signedIn }: { signedIn: boolean }) {
  return (
    <footer className="text-navy-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pt-16 pb-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-balance uppercase sm:text-4xl">
            Hosting something?
            <br />
            <span className="bg-linear-to-r from-primary to-brand-accent bg-clip-text text-transparent">
              Put it on the calendar.
            </span>
          </h2>
          <Button variant="gradient" size="pill" asChild className="h-12 px-7 text-base">
            <Link to={signedIn ? '/events/new' : '/login'} state={signedIn ? undefined : { from: '/events/new' }}>
              Create an Event
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-10 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3 lg:col-span-2">
            <Logo className="text-white" />
            <p className="max-w-sm text-sm text-navy-foreground/60">
              The internal home for <span translate="no">Acme Corp</span> product launches, workshops,
              team-building activities and conferences.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <h3 className="font-semibold text-white">Explore</h3>
            <Link to="/" className="text-navy-foreground/60 hover:text-white">
              All Events
            </Link>
            <Link to={signedIn ? '/events/new' : '/login'} className="text-navy-foreground/60 hover:text-white">
              Create an Event
            </Link>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <h3 className="font-semibold text-white">Account</h3>
            {signedIn ? (
              <span className="text-navy-foreground/60">You are signed in</span>
            ) : (
              <>
                <Link to="/login" className="text-navy-foreground/60 hover:text-white">
                  Log In
                </Link>
                <Link to="/signup" className="text-navy-foreground/60 hover:text-white">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        <p className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-6 text-xs text-navy-foreground/50">
          <span>
            © {CURRENT_YEAR} <span translate="no">Acme Corp</span>. Internal use only.
          </span>
          <span>Built with FastAPI, PostgreSQL &amp; React</span>
        </p>
      </div>
    </footer>
  )
}
