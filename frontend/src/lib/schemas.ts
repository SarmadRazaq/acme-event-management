/**
 * Zod form schemas. They mirror the backend's Pydantic rules so users get instant feedback,
 * while the API stays the source of truth (its 409/422 errors are still shown).
 */
import { z } from 'zod'

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`)

export const eventFormSchema = z.object({
  title: requiredText('Title', 200),
  description: z.string().trim().max(5000, 'Description is too long.'),
  eventDate: z
    .string()
    .min(1, 'Date and time are required.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Enter a valid date.'),
  location: requiredText('Location', 200),
  maxCapacity: z
    .number({ error: 'Capacity must be a number.' })
    .int('Capacity must be a whole number.')
    .gt(0, 'Capacity must be greater than zero.')
    .max(100_000, 'Capacity is too large.'),
})
export type EventFormValues = z.infer<typeof eventFormSchema>

export const registrationFormSchema = z.object({
  employee_name: requiredText('Name', 120),
  employee_email: z.email('Enter a valid e-mail address.'),
  department: z.string().trim().max(100, 'Department is too long.'),
})
export type RegistrationFormValues = z.infer<typeof registrationFormSchema>

export const loginFormSchema = z.object({
  email: z.email('Enter a valid e-mail address.'),
  password: z.string().min(1, 'Password is required.'),
})
export type LoginFormValues = z.infer<typeof loginFormSchema>

export const signupFormSchema = z.object({
  full_name: requiredText('Full name', 120),
  email: z.email('Enter a valid e-mail address.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(128),
})
export type SignupFormValues = z.infer<typeof signupFormSchema>
