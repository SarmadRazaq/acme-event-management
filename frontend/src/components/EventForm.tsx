import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import type { Event, EventInput } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { fromDateTimeLocal, toDateTimeLocal } from '@/lib/format'
import { type EventFormValues, eventFormSchema } from '@/lib/schemas'

import { ConfirmDialog } from './ConfirmDialog'
import { FormError } from './Feedback'

interface EventFormProps {
  /** Existing event when editing; omitted when creating. */
  initial?: Event
  submitLabel: string
  isSubmitting: boolean
  error: unknown
  onSubmit: (input: EventInput) => void
  onCancel: () => void
}

/** Shared create / edit form for events (React Hook Form + Zod + shadcn Field). */
export function EventForm({ initial, submitLabel, isSubmitting, error, onSubmit, onCancel }: EventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      eventDate: initial ? toDateTimeLocal(initial.event_date) : '',
      location: initial?.location ?? '',
      maxCapacity: initial?.max_capacity ?? 20,
    },
  })

  // Warn before closing or reloading the tab with unsaved changes.
  useEffect(() => {
    if (!isDirty || isSubmitting) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty, isSubmitting])

  const submit = handleSubmit((values) =>
    onSubmit({
      title: values.title,
      description: values.description || null,
      event_date: fromDateTimeLocal(values.eventDate),
      location: values.location,
      max_capacity: values.maxCapacity,
    }),
  )

  const cancelButton = (
    <Button type="button" variant="outline" onClick={isDirty ? undefined : onCancel}>
      Cancel
    </Button>
  )

  return (
    <Card>
      <form onSubmit={submit} noValidate>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.title)}>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input
                id="title"
                placeholder="Python Async Workshop…"
                autoComplete="off"
                aria-invalid={Boolean(errors.title)}
                {...register('title')}
              />
              <FieldError errors={[errors.title]} />
            </Field>

            <Field data-invalid={Boolean(errors.description)}>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                rows={4}
                placeholder="What will attendees learn or do?"
                aria-invalid={Boolean(errors.description)}
                {...register('description')}
              />
              <FieldDescription>Optional.</FieldDescription>
              <FieldError errors={[errors.description]} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.eventDate)}>
                <FieldLabel htmlFor="eventDate">Date &amp; Time</FieldLabel>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  aria-invalid={Boolean(errors.eventDate)}
                  {...register('eventDate')}
                />
                <FieldDescription>Your local time.</FieldDescription>
                <FieldError errors={[errors.eventDate]} />
              </Field>
              <Field data-invalid={Boolean(errors.maxCapacity)}>
                <FieldLabel htmlFor="maxCapacity">Maximum Capacity</FieldLabel>
                <Input
                  id="maxCapacity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  aria-invalid={Boolean(errors.maxCapacity)}
                  {...register('maxCapacity', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.maxCapacity]} />
              </Field>
            </div>

            <Field data-invalid={Boolean(errors.location)}>
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input
                id="location"
                placeholder="Conference Room B, HQ…"
                autoComplete="off"
                aria-invalid={Boolean(errors.location)}
                {...register('location')}
              />
              <FieldError errors={[errors.location]} />
            </Field>

            <FormError error={error} />
          </FieldGroup>
        </CardContent>

        <CardFooter className="mt-6 justify-end gap-3">
          {isDirty ? (
            <ConfirmDialog
              trigger={cancelButton}
              title="Discard Changes?"
              description="You have unsaved changes to this event. They will be lost."
              confirmLabel="Discard"
              onConfirm={onCancel}
            />
          ) : (
            cancelButton
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
