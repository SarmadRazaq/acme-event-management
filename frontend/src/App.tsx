import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'

import { Spinner } from './components/Feedback'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'

// Each page is loaded on demand (code splitting), keeping the first download small.
const EventsPage = lazy(() => import('./pages/EventsPage').then((m) => ({ default: m.EventsPage })))
const EventDetailPage = lazy(() =>
  import('./pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage })),
)
const CreateEventPage = lazy(() =>
  import('./pages/EventFormPage').then((m) => ({ default: m.CreateEventPage })),
)
const EditEventPage = lazy(() =>
  import('./pages/EventFormPage').then((m) => ({ default: m.EditEventPage })),
)
const LoginPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.SignupPage })))
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

/** Route table. Pages that change data require a logged-in user. */
export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<EventsPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="events/new" element={<CreateEventPage />} />
            <Route path="events/:id/edit" element={<EditEventPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
