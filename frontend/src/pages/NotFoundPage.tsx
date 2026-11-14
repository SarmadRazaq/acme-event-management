import { CompassIcon } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/Feedback'
import { PageHero } from '@/components/PageHero'
import { Button } from '@/components/ui/button'

export function NotFoundPage({ message = 'The page you are looking for does not exist.' }) {
  return (
    <>
      <PageHero title="Page Not Found" crumbs={[{ label: '404' }]} />
      <div className="mx-auto max-w-6xl px-4 pt-10">
        <EmptyState
          icon={CompassIcon}
          title="404: Not Found"
          description={message}
          action={
            <Button variant="gradient" size="pill" asChild>
              <Link to="/">Back to Events</Link>
            </Button>
          }
        />
      </div>
    </>
  )
}
