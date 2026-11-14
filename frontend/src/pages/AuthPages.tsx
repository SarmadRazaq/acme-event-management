import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { FormError } from '@/components/Feedback'
import { PageHero } from '@/components/PageHero'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useLogin, useSignup } from '@/hooks/useAuth'
import {
  type LoginFormValues,
  type SignupFormValues,
  loginFormSchema,
  signupFormSchema,
} from '@/lib/schemas'
import { useIsAuthenticated } from '@/store/authStore'

/** Centered card used by the login and sign-up pages. */
function AuthCard({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <>
      <PageHero title={title} crumbs={[{ label: title }]} />
      <div className="px-4">
        <Card className="relative z-10 mx-auto -mt-8 w-full max-w-md shadow-xl shadow-navy/10">
          <CardHeader className="text-center">
            <CardTitle>
              <h2 className="font-heading text-xl font-bold">
                {title === 'Log In' ? 'Welcome Back' : 'Join Acme Events'}
              </h2>
            </CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </>
  )
}

/** Where to go after logging in: back to the protected page that sent us here, or home. */
function useRedirectTarget() {
  const location = useLocation()
  return (location.state as { from?: string } | null)?.from ?? '/'
}

export function LoginPage() {
  const isAuthenticated = useIsAuthenticated()
  const navigate = useNavigate()
  const redirectTo = useRedirectTarget()
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) })

  if (isAuthenticated && !login.isSuccess) return <Navigate to={redirectTo} replace />

  const submit = handleSubmit((values) =>
    login.mutate(values, { onSuccess: () => navigate(redirectTo, { replace: true }) }),
  )

  return (
    <AuthCard
      title="Log In"
      subtitle={
        <>
          No account?{' '}
          <Link to="/signup" state={{ from: redirectTo }} className="text-primary underline-offset-4 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={Boolean(errors.password)}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            <FieldError errors={[errors.password]} />
          </Field>
          <FormError error={login.error} />
          <Button type="submit" variant="gradient" size="pill" className="w-full" disabled={login.isPending}>
            {login.isPending && <Spinner data-icon="inline-start" />}
            {login.isPending ? 'Logging In…' : 'Log In'}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}

export function SignupPage() {
  const isAuthenticated = useIsAuthenticated()
  const navigate = useNavigate()
  const redirectTo = useRedirectTarget()
  const signup = useSignup()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupFormSchema) })

  if (isAuthenticated && !signup.isSuccess) return <Navigate to={redirectTo} replace />

  const submit = handleSubmit((values) =>
    signup.mutate(values, { onSuccess: () => navigate(redirectTo, { replace: true }) }),
  )

  return (
    <AuthCard
      title="Create an Account"
      subtitle={
        <>
          Already registered?{' '}
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.full_name)}>
            <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
            <Input
              id="full_name"
              autoComplete="name"
              aria-invalid={Boolean(errors.full_name)}
              {...register('full_name')}
            />
            <FieldError errors={[errors.full_name]} />
          </Field>
          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="email">Work E-mail</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={Boolean(errors.password)}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            <FieldDescription>At least 8 characters.</FieldDescription>
            <FieldError errors={[errors.password]} />
          </Field>
          <FormError error={signup.error} />
          <Button type="submit" variant="gradient" size="pill" className="w-full" disabled={signup.isPending}>
            {signup.isPending && <Spinner data-icon="inline-start" />}
            {signup.isPending ? 'Creating Account…' : 'Sign Up'}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
