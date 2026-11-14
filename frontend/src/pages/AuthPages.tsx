import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { FormError } from '../components/Feedback'
import { useLogin, useSignup } from '../hooks/useAuth'
import {
  type LoginFormValues,
  type SignupFormValues,
  loginFormSchema,
  signupFormSchema,
} from '../lib/schemas'
import { useIsAuthenticated } from '../store/authStore'

/** Centered card used by the login and sign-up pages. */
function AuthCard({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md space-y-6 pt-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="card p-6">{children}</div>
    </div>
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
      title="Log in"
      subtitle={
        <>
          No account?{' '}
          <Link to="/signup" state={{ from: redirectTo }} className="text-brand-600 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </div>
        <FormError error={login.error} />
        <button type="submit" className="btn-primary w-full" disabled={login.isPending}>
          {login.isPending ? 'Logging in…' : 'Log in'}
        </button>
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
      title="Create an account"
      subtitle={
        <>
          Already registered?{' '}
          <Link to="/login" className="text-brand-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="full_name" className="label">
            Full name
          </label>
          <input
            id="full_name"
            autoComplete="name"
            className="input"
            aria-invalid={Boolean(errors.full_name)}
            {...register('full_name')}
          />
          {errors.full_name && <p className="field-error">{errors.full_name.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="label">
            Work e-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="input"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </div>
        <FormError error={signup.error} />
        <button type="submit" className="btn-primary w-full" disabled={signup.isPending}>
          {signup.isPending ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
    </AuthCard>
  )
}
