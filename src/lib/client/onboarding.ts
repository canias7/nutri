import { z } from 'zod'

/** Empty form inputs arrive as '', which should mean "not answered", not 0. */
const optionalNumber = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : Number(value)))
  .refine((value) => value === undefined || Number.isFinite(value), {
    message: 'Enter a number',
  })

export const onboardingSchema = z.object({
  age: optionalNumber.refine(
    (value) => value === undefined || (value >= 1 && value <= 130),
    { message: 'Enter an age between 1 and 130' },
  ),
  gender: z.string().trim().max(40).optional(),
  heightCm: optionalNumber.refine(
    (value) => value === undefined || (value >= 30 && value <= 280),
    { message: 'Enter a realistic height' },
  ),
  startWeightKg: optionalNumber.refine(
    (value) => value === undefined || (value >= 10 && value <= 500),
    { message: 'Enter a realistic weight' },
  ),

  goal: z.string().trim().min(1, 'Tell us what you want to achieve').max(500),
  goalDeadline: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value))
    .refine((value) => value === null || !Number.isNaN(Date.parse(value)), {
      message: 'Enter a valid date',
    }),

  complaintEmotional: z.string().trim().max(1000).optional(),
  complaintDigestion: z.string().trim().max(1000).optional(),
  complaintSkin: z.string().trim().max(1000).optional(),
  complaintOther: z.string().trim().max(1000).optional(),

  waterTargetMl: optionalNumber.refine(
    (value) => value === undefined || (value >= 250 && value <= 10000),
    { message: 'Enter a target between 250 and 10000 ml' },
  ),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
