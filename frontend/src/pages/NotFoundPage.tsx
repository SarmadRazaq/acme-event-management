import { CompassIcon } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/Feedback'
import { Button } from '@/components/ui/button'

export function NotFoundPage({ message = 'The page you are looking for does not exist.' }) {
  return (
    <div className="py-10">
      <h1 className="sr-only">Page Not Found</h1>
      <EmptyState
        icon={CompassIcon}
        title="404: Not Found"
        description={message}
        action={
          <Button asChild>
            <Link to="/">Back to Events</Link>
          </Button>
        }
      />
    </div>
  )
}
