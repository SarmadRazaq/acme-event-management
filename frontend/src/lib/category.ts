/**
 * Event categories for display. The API has no category field, so the category is inferred
 * from keywords in the title, matching the event types named in the brief
 * (product launches, workshops/training, team-building, conferences).
 */
import {
  type LucideIcon,
  MegaphoneIcon,
  MicIcon,
  PartyPopperIcon,
  PresentationIcon,
  RocketIcon,
} from 'lucide-react'

export interface Category {
  label: string
  icon: LucideIcon
  /** Two OKLCH hues used to paint the card artwork. */
  hues: [number, number]
}

const CATEGORIES: { match: RegExp; category: Category }[] = [
  {
    match: /launch|release|unveil|product/i,
    category: { label: 'Product Launch', icon: RocketIcon, hues: [258, 50] },
  },
  {
    match: /workshop|training|bootcamp|course|hands-on|lab|class|for developers|kubernetes|python|masterclass/i,
    category: { label: 'Workshop', icon: PresentationIcon, hues: [245, 200] },
  },
  {
    match: /team|escape|offsite|social|party|picnic|building/i,
    category: { label: 'Team Building', icon: PartyPopperIcon, hues: [40, 75] },
  },
  {
    match: /conference|summit|keynote|talk|meetup|forum|expo/i,
    category: { label: 'Conference', icon: MicIcon, hues: [262, 225] },
  },
]

const DEFAULT_CATEGORY: Category = { label: 'Corporate', icon: MegaphoneIcon, hues: [250, 60] }

export function categoryFor(title: string): Category {
  return CATEGORIES.find(({ match }) => match.test(title))?.category ?? DEFAULT_CATEGORY
}
