/** Date helpers. The API speaks UTC ISO 8601; the UI shows the user's local time. */

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export const formatDateTime = (iso: string) => dateTimeFormatter.format(new Date(iso))

/** Convert an ISO string to the "YYYY-MM-DDTHH:mm" value a datetime-local input expects. */
export function toDateTimeLocal(iso: string): string {
  const date = new Date(iso)
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

/** Convert a datetime-local value (local time, no zone) to a UTC ISO string for the API. */
export const fromDateTimeLocal = (value: string) => new Date(value).toISOString()

export const isPast = (iso: string) => new Date(iso).getTime() < Date.now()

const dateFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })

/** Date only, e.g. "20 Nov 2026" (locale aware). */
export const formatDate = (iso: string) => dateFormatter.format(new Date(iso))

/** Time only, e.g. "15:00" (locale aware). */
export const formatTime = (iso: string) => timeFormatter.format(new Date(iso))
