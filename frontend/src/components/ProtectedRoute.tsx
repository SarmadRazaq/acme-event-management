import { Navigate, Outlet, useLocation } from 'react-router'

import { useIsAuthenticated } from '../store/authStore'

/**
 * Route guard for pages that need a logged-in user (create / edit event).
 * Anonymous visitors are sent to the login page, which brings them back afterwards.
 */
export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
