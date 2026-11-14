import { Link } from 'react-router'

export function NotFoundPage({ message = 'The page you are looking for does not exist.' }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <p className="text-5xl font-bold text-brand-600">404</p>
      <p className="text-slate-600">{message}</p>
      <Link to="/" className="btn-primary">
        Back to events
      </Link>
    </div>
  )
}
