import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { useRegisterForEvent } from '../hooks/useEvents'
import { type RegistrationFormValues, registrationFormSchema } from '../lib/schemas'
import { useAuthStore } from '../store/authStore'
import { FormError } from './Feedback'

/**
 * Sign-up form for an event. Business-rule errors from the API (duplicate registration,
 * event full) come back as 409 and are shown inline under the form.
 */
export function RegistrationForm({ eventId, isFull }: { eventId: number; isFull: boolean }) {
  const user = useAuthStore((state) => state.user)
  const mutation = useRegisterForEvent(eventId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    // Logged-in users get their own details pre-filled.
    defaultValues: {
      employee_name: user?.full_name ?? '',
      employee_email: user?.email ?? '',
      department: '',
    },
  })

  const submit = handleSubmit((values) =>
    mutation.mutate(
      { ...values, department: values.department || null },
      { onSuccess: () => reset({ employee_name: '', employee_email: '', department: '' }) },
    ),
  )

  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-5">
      <div>
        <h2 className="font-semibold text-slate-900">Register for this event</h2>
        <p className="text-sm text-slate-500">Each employee can register once.</p>
      </div>

      <div>
        <label htmlFor="employee_name" className="label">
          Full name
        </label>
        <input
          id="employee_name"
          className="input"
          aria-invalid={Boolean(errors.employee_name)}
          {...register('employee_name')}
        />
        {errors.employee_name && <p className="field-error">{errors.employee_name.message}</p>}
      </div>
      <div>
        <label htmlFor="employee_email" className="label">
          Work e-mail
        </label>
        <input
          id="employee_email"
          type="email"
          className="input"
          aria-invalid={Boolean(errors.employee_email)}
          {...register('employee_email')}
        />
        {errors.employee_email && <p className="field-error">{errors.employee_email.message}</p>}
      </div>
      <div>
        <label htmlFor="department" className="label">
          Department <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input id="department" className="input" {...register('department')} />
        {errors.department && <p className="field-error">{errors.department.message}</p>}
      </div>

      <FormError error={mutation.error} />

      <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Registering…' : isFull ? 'Try to register (event is full)' : 'Register'}
      </button>
    </form>
  )
}
