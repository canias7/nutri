import { z } from 'zod'

/** Empty form inputs arrive as '', which should mean "not answered", not 0. */
const optionalNumber = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : Number(value)))
  .refine((value) => value === undefined || Number.isFinite(value), {
    message: 'Enter a number',
  })

/**
 * What onboarding asks for: the measurements a target can be worked out from.
 *
 * It used to ask for the goal, the water target and four boxes about how you
 * feel, before anyone had logged a single day. Every one of those is on the
 * profile, which is where a person is willing to sit and think — the door into
 * the app is not.
 */
export const biometricsSchema = z.object({
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
})

/** The rest of the picture, asked for on the profile once someone is inside. */
export const programSchema = z.object({
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

export type BiometricsInput = z.infer<typeof biometricsSchema>
export type ProgramInput = z.infer<typeof programSchema>
