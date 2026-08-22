import { z } from 'zod'

// Supabase rejects anything under 6 characters, so matching it here means the
// user is told before the round trip rather than after.
const password = z.string().min(6, 'Use at least 6 characters')

export const signUpSchema = z.object({
  fullName: z.string().trim().min(1, 'Please enter your name').max(120),
  email: z.email('Enter a valid email address'),
  password,
  role: z.enum(['client', 'nutritionist']),
})

export const signInSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
