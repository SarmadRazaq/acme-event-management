import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useRegisterForEvent } from '@/hooks/useEvents'
import { type RegistrationFormValues, registrationFormSchema } from '@/lib/schemas'
import { useAuthStore } from '@/store/authStore'

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
    <Card className="shadow-xl shadow-navy/10">
      <CardHeader>
        <CardTitle>
          <h2 className="font-heading text-lg font-bold">Register for This Event</h2>
        </CardTitle>
        <CardDescription>
          {isFull ? 'This event is full. New registrations will be rejected.' : 'Each employee can register once.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.employee_name)}>
              <FieldLabel htmlFor="employee_name">Full Name</FieldLabel>
              <Input
                id="employee_name"
                autoComplete="name"
                aria-invalid={Boolean(errors.employee_name)}
                {...register('employee_name')}
              />
              <FieldError errors={[errors.employee_name]} />
            </Field>
            <Field data-invalid={Boolean(errors.employee_email)}>
              <FieldLabel htmlFor="employee_email">Work E-mail</FieldLabel>
              <Input
                id="employee_email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                aria-invalid={Boolean(errors.employee_email)}
                {...register('employee_email')}
              />
              <FieldError errors={[errors.employee_email]} />
            </Field>
            <Field data-invalid={Boolean(errors.department)}>
              <FieldLabel htmlFor="department">Department</FieldLabel>
              <Input id="department" autoComplete="organization-title" {...register('department')} />
              <FieldDescription>Optional.</FieldDescription>
              <FieldError errors={[errors.department]} />
            </Field>

            <FormError error={mutation.error} />

            <Button type="submit" variant="gradient" size="pill" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner data-icon="inline-start" />}
              {mutation.isPending ? 'Registering…' : isFull ? 'Try to Register' : 'Register'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
