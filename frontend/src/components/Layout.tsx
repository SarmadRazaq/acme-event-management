import { CalendarDaysIcon, LogOutIcon, PlusIcon } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'

import { Button } from '@/components/ui/button'
import { useLogout } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useApplyTheme } from '@/store/themeStore'

import { ThemeToggle } from './ThemeToggle'

/** App shell: skip link, top navigation bar, and the routed page below it. */
export function Layout() {
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()
  useApplyTheme()

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <div className="flex min-h-svh flex-col">
      {/* Keyboard users can jump straight past the navigation. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold" translate="no">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <CalendarDaysIcon className="size-4" aria-hidden />
            </span>
            <span className="hidden sm:inline">Acme Events</span>
          </Link>

          <nav aria-label="Main" className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Events
            </NavLink>
            {user && (
              <NavLink to="/events/new" className={navClass}>
                New Event
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <span className="hidden truncate text-sm text-muted-foreground md:inline" title={user.email}>
                  {user.full_name}
                </span>
                <Button variant="outline" onClick={logout}>
                  <LogOutIcon data-icon="inline-start" />
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex">
                  <Link to="/signup">
                    <PlusIcon data-icon="inline-start" />
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none">
        <Outlet />
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <span translate="no">Acme Corp</span> · Internal Event Management · FastAPI + React
      </footer>
    </div>
  )
}
