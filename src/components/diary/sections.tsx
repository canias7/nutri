'use client'

import type { ReactNode } from 'react'

import { Field, Input, Textarea, YesNoField } from '@/components/form-fields'
import { WeightInput } from '@/components/units/weight-input'
import { AutosaveSection } from '@/components/diary/autosave-section'
import {
  saveComplaints,
  saveDaytime,
  saveEvening,
  saveExtraSupplements,
  saveMorning,
} from '@/lib/diary/actions'
import type { SectionNeed } from '@/lib/diary/completeness'
import type { DailyLog } from '@/lib/diary/queries'

type SectionProps = {
  date: string
  log: DailyLog | null
  /** What this section still needs, so the row can draw its star and pill. */
  need: SectionNeed
  /** What is already in it, shown on the closed row. */
  summary?: ReactNode
}

/** Times come back from Postgres as HH:MM:SS; the input wants HH:MM. */
function toTimeInput(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : ''
}

export function MorningSection({ date, log, need, summary }: SectionProps) {
  return (
    <AutosaveSection
      need={need}
      summary={summary}
      title="Morning"
      description="Weigh yourself before breakfast, on an empty stomach."
      date={date}
      action={saveMorning}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Wake-up time" htmlFor="wakeTime" required>
          <Input id="wakeTime" name="wakeTime" type="time" defaultValue={toTimeInput(log?.wake_time)} />
        </Field>

        {/* Asked here rather than in the evening, because this is the point at
            which the client knows the answer: the night is over. The bedtime on
            this day's row belongs to the night that follows it. */}
        <Field
          label="Hours of sleep"
          htmlFor="sleepHours"
          hint="Last night, roughly. Halves are fine."
        >
          <Input
            id="sleepHours"
            name="sleepHours"
            type="number"
            inputMode="decimal"
            step={0.5}
            min={0}
            max={24}
            placeholder="7.5"
            defaultValue={log?.sleep_hours ?? ''}
          />
        </Field>

        <Field label="Morning weight" htmlFor="weightKg" required>
          <WeightInput
            id="weightKg"
            name="weightKg"
            storedValue={log?.weight_kg ?? null}
            placeholder="70.5"
          />
        </Field>

        <Field label="Energy level (1–10)" htmlFor="energyLevel" required>
          <Input
            id="energyLevel"
            name="energyLevel"
            type="number"
            inputMode="numeric"
            min={1}
            max={10}
            placeholder="7"
            defaultValue={log?.energy_level ?? ''}
          />
        </Field>
      </div>

      <Field label="How you woke up" htmlFor="wakingMood">
        <Input
          id="wakingMood"
          name="wakingMood"
          placeholder="Rested, groggy, anxious…"
          defaultValue={log?.waking_mood ?? ''}
        />
      </Field>

      <Field label="Morning activity" htmlFor="morningActivity">
        <Input
          id="morningActivity"
          name="morningActivity"
          placeholder="Stretching, a walk, nothing yet…"
          defaultValue={log?.morning_activity ?? ''}
        />
      </Field>

      <Field
        label="First warm drink"
        htmlFor="firstWarmDrink"
        hint="What you had before anything else."
      >
        <Input
          id="firstWarmDrink"
          name="firstWarmDrink"
          placeholder="Warm water with lemon, herbal tea, chicory…"
          defaultValue={log?.first_warm_drink ?? ''}
        />
      </Field>
    </AutosaveSection>
  )
}

export function DaytimeSection({ date, log, need, summary }: SectionProps) {
  return (
    <AutosaveSection
      need={need}
      summary={summary}
      title="Activity & stress"
      description="Movement, time outdoors, and how the day felt."
      date={date}
      action={saveDaytime}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Activity" htmlFor="activityType">
          <Input
            id="activityType"
            name="activityType"
            placeholder="Running, pilates, steps…"
            defaultValue={log?.activity_type ?? ''}
          />
        </Field>

        <Field label="For how long (minutes)" htmlFor="activityMinutes">
          <Input
            id="activityMinutes"
            name="activityMinutes"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="45"
            defaultValue={log?.activity_minutes ?? ''}
          />
        </Field>

        <Field label="Stress level (0–10)" htmlFor="stressLevel">
          <Input
            id="stressLevel"
            name="stressLevel"
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            placeholder="4"
            defaultValue={log?.stress_level ?? ''}
          />
        </Field>

        <Field label="Time outdoors (minutes)" htmlFor="outdoorMinutes">
          <Input
            id="outdoorMinutes"
            name="outdoorMinutes"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="30"
            defaultValue={log?.outdoor_minutes ?? ''}
          />
        </Field>
      </div>

      <Field label="What helped with the stress" htmlFor="stressRelief">
        <Input
          id="stressRelief"
          name="stressRelief"
          placeholder="Breathing, a book, meditation…"
          defaultValue={log?.stress_relief ?? ''}
        />
      </Field>
    </AutosaveSection>
  )
}

export function ExtraSupplementsSection({ date, log, need, summary }: SectionProps) {
  return (
    <AutosaveSection
      need={need}
      summary={summary}
      title="Anything else you took"
      description="One-offs that are not on your regular list."
      date={date}
      action={saveExtraSupplements}
    >
      <Field label="Other supplements" htmlFor="extraSupplements">
        <Input
          id="extraSupplements"
          name="extraSupplements"
          placeholder="Magnesium, vitamin D — comma separated"
          defaultValue={log?.extra_supplements ?? ''}
        />
      </Field>
    </AutosaveSection>
  )
}

export function EveningSection({ date, log, need, summary }: SectionProps) {
  return (
    <AutosaveSection
      need={need}
      summary={summary}
      title="Evening"
      description="How the day wound down."
      date={date}
      action={saveEvening}
    >
      <Field label="Evening routine" htmlFor="eveningRitual">
        <Input
          id="eveningRitual"
          name="eveningRitual"
          placeholder="Warm bath, reading, meditation…"
          defaultValue={log?.evening_ritual ?? ''}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Screens off at" htmlFor="gadgetsOffAt">
          <Input
            id="gadgetsOffAt"
            name="gadgetsOffAt"
            type="time"
            defaultValue={toTimeInput(log?.gadgets_off_at)}
          />
        </Field>

        <Field label="Asleep at" htmlFor="bedTime" required>
          <Input
            id="bedTime"
            name="bedTime"
            type="time"
            defaultValue={toTimeInput(log?.bed_time)}
          />
        </Field>
      </div>
    </AutosaveSection>
  )
}

export function ComplaintsSection({ date, log, need, summary }: SectionProps) {
  return (
    <AutosaveSection
      need={need}
      summary={summary}
      title="How you felt"
      description="Symptoms and changes, however small. This is what your nutritionist reads most closely."
      date={date}
      action={saveComplaints}
    >
      <YesNoField
        legend="On your period"
        name="onPeriod"
        value={log?.on_period ?? null}
        hint="Leave both blank if it does not apply to you."
      />

      <Field label="Digestion & gut" htmlFor="complaintDigestion">
        <Textarea
          id="complaintDigestion"
          name="complaintDigestion"
          placeholder="Bloating, heartburn, heaviness, bowel movements normal…"
          defaultValue={log?.complaint_digestion ?? ''}
        />
      </Field>

      <Field label="Skin, hair & nails" htmlFor="complaintSkin">
        <Textarea
          id="complaintSkin"
          name="complaintSkin"
          placeholder="Dryness, breakouts, normal…"
          defaultValue={log?.complaint_skin ?? ''}
        />
      </Field>

      <Field label="Mood & emotions" htmlFor="complaintEmotional">
        <Textarea
          id="complaintEmotional"
          name="complaintEmotional"
          placeholder="Irritable, calm, flat…"
          defaultValue={log?.complaint_emotional ?? ''}
        />
      </Field>

      <Field label="Anything else" htmlFor="complaintOther">
        <Textarea
          id="complaintOther"
          name="complaintOther"
          placeholder="Headache, sugar cravings, fatigue…"
          defaultValue={log?.complaint_other ?? ''}
        />
      </Field>
    </AutosaveSection>
  )
}
