import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import type { Event, EventInput } from '../api/types'
import { fromDateTimeLocal, toDateTimeLocal } from '../lib/format'
import { type EventFormValues, eventFormSchema } from '../lib/schemas'
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

/** Shared create / edit form for events (React Hook Form + Zod). */
export function EventForm({
  initial,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
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

  const submit = handleSubmit((values) =>
    onSubmit({
      title: values.title,
      description: values.description || null,
      event_date: fromDateTimeLocal(values.eventDate),
      location: values.location,
      max_capacity: values.maxCapacity,
    }),
  )

  return (
    <form onSubmit={submit} noValidate className="card space-y-5 p-6">
      <div>
        <label htmlFor="title" className="label">
          Title
        </label>
        <input
          id="title"
          className="input"
          placeholder="Python Async Workshop"
          aria-invalid={Boolean(errors.title)}
          {...register('title')}
        />
        {errors.title && <p className="field-error">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="label">
          Description <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={4}
          className="input"
          placeholder="What will attendees learn or do?"
          aria-invalid={Boolean(errors.description)}
          {...register('description')}
        />
        {errors.description && <p className="field-error">{errors.description.message}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="eventDate" className="label">
            Date &amp; time
          </label>
          <input
            id="eventDate"
            type="datetime-local"
            className="input"
            aria-invalid={Boolean(errors.eventDate)}
            {...register('eventDate')}
          />
          {errors.eventDate && <p className="field-error">{errors.eventDate.message}</p>}
        </div>
        <div>
          <label htmlFor="maxCapacity" className="label">
            Maximum capacity
          </label>
          <input
            id="maxCapacity"
            type="number"
            min={1}
            className="input"
            aria-invalid={Boolean(errors.maxCapacity)}
            {...register('maxCapacity', { valueAsNumber: true })}
          />
          {errors.maxCapacity && <p className="field-error">{errors.maxCapacity.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="location" className="label">
          Location
        </label>
        <input
          id="location"
          className="input"
          placeholder="Conference Room B, HQ"
          aria-invalid={Boolean(errors.location)}
          {...register('location')}
        />
        {errors.location && <p className="field-error">{errors.location.message}</p>}
      </div>

      <FormError error={error} />

      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
