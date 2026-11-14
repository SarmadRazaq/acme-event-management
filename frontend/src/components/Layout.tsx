import { Link, NavLink, Outlet } from 'react-router'

import { useLogout } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'

/** App shell: top navigation bar plus the routed page below it. */
export function Layout() {
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-slate-900'
    }`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
              A
            </span>
            <span className="hidden sm:inline">Acme Events</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Events
            </NavLink>
            {user && (
              <NavLink to="/events/new" className={navClass}>
                New event
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden text-sm text-slate-600 md:inline" title={user.email}>
                  {user.full_name}
                </span>
                <button type="button" className="btn-secondary" onClick={logout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Log in
                </Link>
                <Link to="/signup" className="btn-primary hidden sm:inline-flex">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Acme Corp · Internal Event Management · FastAPI + React
      </footer>
    </div>
  )
}
