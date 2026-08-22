import { z } from 'zod'

// Supabase rejects anything under 6 characters, so matching it here means the
// user is told before the round trip rather than after.
const password = z.string().min(6, 'Use at least 6 characters')

// Public sign-up creates clients only. Nutritionist accounts are provisioned
// directly against the database, so `role` is deliberately absent here rather
// than accepted and validated — a field that is never read cannot be forged.
export const signUpSchema = z.object({
  fullName: z.string().trim().min(1, 'Please enter your name').max(120),
  email: z.email('Enter a valid email address'),
  password,
})

export const signInSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
