'use server'

import { revalidatePath } from 'next/cache'

import { requireClient } from '@/lib/auth/session'
import { asList, missingFromDay } from '@/lib/diary/completeness'
import { field } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'
import type { TablesUpdate } from '@/lib/supabase/database.types'

import { MAX_MEAL_PHOTOS } from './meal-photos'
import { isValidDateParam } from './date'
import type { SaveState } from './save-state'

const saved: SaveState = { status: 'saved' }
const failed: SaveState = {
  status: 'error',
  message: 'Could not save. Check your connection and try again.',
}

/** Empty means "not answered" rather than zero. */
function optionalNumber(formData: FormData, name: string): number | null {
  const raw = field(formData, name)
  if (raw === '') return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

/** Empty time inputs must be stored as NULL, not ''. */
function optionalTime(formData: FormData, name: string): string | null {
  const raw = field(formData, name)
  return raw === '' ? null : raw
}

/**
 * Hours slept, clamped to a night that could have happened.
 *
 * The column refuses anything outside 0–24, and a rejected write would surface
 * as "could not save, check your connection" — which is a lie about a typo.
 * Clamping here means the constraint is only ever a backstop.
 */
function optionalHours(formData: FormData, name: string): number | null {
  const value = optionalNumber(formData, name)
  if (value === null) return null
  return Math.min(24, Math.max(0, Math.round(value * 10) / 10))
}

/** Yes, no, and the third answer: nobody has said. */
function optionalBoolean(formData: FormData, name: string): boolean | null {
  const raw = field(formData, name)
  if (raw === 'yes') return true
  if (raw === 'no') return false
  return null
}

/**
 * Finds the day's row, creating it on first write.
 *
 * Days are only materialised once something is actually logged, so an untouched
 * date has no row and the history view can tell the difference between a blank
 * day and a missed one.
 */
async function ensureLog(date: string): Promise<{ id: string; clientId: string } | null> {
  if (!isValidDateParam(date)) return null

  const { viewer } = await requireClient()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('daily_logs')
    .select('id')
    .eq('client_id', viewer.id)
    .eq('log_date', date)
    .maybeSingle()

  if (existing) return { id: existing.id, clientId: viewer.id }

  const { data: created, error } = await supabase
    .from('daily_logs')
    .insert({ client_id: viewer.id, log_date: date })
    .select('id')
    .single()

  if (error || !created) return null
  return { id: created.id, clientId: viewer.id }
}

function refresh(date: string) {
  revalidatePath(`/diary/${date}`)
  revalidatePath('/diary')
  revalidatePath('/dashboard')
  revalidatePath('/history')
}

async function updateLog(
  date: string,
  patch: TablesUpdate<'daily_logs'>,
): Promise<SaveState> {
  const log = await ensureLog(date)
  if (!log) return failed

  const supabase = await createClient()
  const { error } = await supabase
    .from('daily_logs')
    .update(patch)
    .eq('id', log.id)

  if (error) return failed
  refresh(date)
  return saved
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export async function saveMorning(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const date = field(formData, 'date')
  return updateLog(date, {
    wake_time: optionalTime(formData, 'wakeTime'),
    sleep_hours: optionalHours(formData, 'sleepHours'),
    waking_mood: field(formData, 'wakingMood'),
    weight_kg: optionalNumber(formData, 'weightKg'),
    morning_activity: field(formData, 'morningActivity'),
    energy_level: optionalNumber(formData, 'energyLevel'),
    first_warm_drink: field(formData, 'firstWarmDrink'),
  })
}

export async function saveDaytime(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const date = field(formData, 'date')
  return updateLog(date, {
    activity_type: field(formData, 'activityType'),
    activity_minutes: optionalNumber(formData, 'activityMinutes'),
    stress_level: optionalNumber(formData, 'stressLevel'),
    stress_relief: field(formData, 'stressRelief'),
    outdoor_minutes: optionalNumber(formData, 'outdoorMinutes'),
  })
}

export async function saveEvening(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const date = field(formData, 'date')
  return updateLog(date, {
    evening_ritual: field(formData, 'eveningRitual'),
    gadgets_off_at: optionalTime(formData, 'gadgetsOffAt'),
    bed_time: optionalTime(formData, 'bedTime'),
  })
}

export async function saveComplaints(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const date = field(formData, 'date')
  return updateLog(date, {
    on_period: optionalBoolean(formData, 'onPeriod'),
    complaint_emotional: field(formData, 'complaintEmotional'),
    complaint_skin: field(formData, 'complaintSkin'),
    complaint_digestion: field(formData, 'complaintDigestion'),
    complaint_other: field(formData, 'complaintOther'),
  })
}

/**
 * The whole food section at once: every entry the day has, in order.
 *
 * Entries are keyed by their position rather than by row id, so this is an
 * upsert per entry followed by a delete of anything past the end. A failed
 * write leaves the previous answers standing, which a delete-then-insert would
 * not — and the client never has to learn what id a row was given.
 */
export async function saveFood(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const date = field(formData, 'date')

  const eaten = formData.getAll('eaten').map(String)
  const amount = formData.getAll('amount').map(String)
  const method = formData.getAll('method').map(String)
  const eatenAt = formData.getAll('eatenAt').map(String)
  // One field per entry holding that entry's photos, newline separated — a flat
  // repeated field could not say which of five belonged to which entry.
  const photos = formData.getAll('photoPaths').map((value) =>
    String(value).split('\n').map((path) => path.trim()).filter(Boolean).slice(0, MAX_MEAL_PHOTOS),
  )

  const log = await ensureLog(date)
  if (!log) return failed

  const rows = eaten.map((text, index) => ({
    daily_log_id: log.id,
    sort_order: index,
    eaten: text.trim(),
    amount: (amount[index] ?? '').trim(),
    method: (method[index] ?? '').trim(),
    eaten_at: eatenAt[index] ? eatenAt[index] : null,
    photo_paths: photos[index] ?? [],
  }))

  // An entry with nothing in it is not an entry. Trailing blanks are simply not
  // written, so opening the section and closing it again leaves no trace.
  const filled = rows.filter(
    (row) =>
      row.eaten ||
      row.amount ||
      row.method ||
      row.eaten_at ||
      row.photo_paths.length > 0,
  )
  // Positions have to stay dense, or the unique key leaves gaps that the next
  // save collides with.
  const dense = filled.map((row, index) => ({ ...row, sort_order: index }))

  const supabase = await createClient()

  // Read the photos already on file before overwriting, so any that the save
  // drops can be taken out of the bucket too rather than left orphaned.
  const { data: before } = await supabase
    .from('log_meals')
    .select('photo_paths')
    .eq('daily_log_id', log.id)

  if (dense.length > 0) {
    const { error } = await supabase
      .from('log_meals')
      .upsert(dense, { onConflict: 'daily_log_id,sort_order' })
    if (error) return failed
  }

  const { error: pruneError } = await supabase
    .from('log_meals')
    .delete()
    .eq('daily_log_id', log.id)
    .gte('sort_order', dense.length)

  if (pruneError) return failed

  const kept = new Set(dense.flatMap((row) => row.photo_paths))
  const orphaned = (before ?? [])
    .flatMap((row) => row.photo_paths)
    .filter((path) => path && !kept.has(path))

  // Best effort: a file left behind costs a few kilobytes, and a failure here
  // is not worth telling someone their lunch did not save.
  if (orphaned.length > 0) {
    await supabase.storage.from('meal-photos').remove(orphaned)
  }

  refresh(date)
  return saved
}

export async function saveExtraSupplements(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const date = field(formData, 'date')
  return updateLog(date, { extra_supplements: field(formData, 'extraSupplements') })
}

// ---------------------------------------------------------------------------
// Rows that repeat within a day
// ---------------------------------------------------------------------------

export async function toggleSupplement(
  date: string,
  supplementId: string,
  taken: boolean,
): Promise<SaveState> {
  const log = await ensureLog(date)
  if (!log) return failed

  const supabase = await createClient()
  const { error } = taken
    ? await supabase
        .from('log_supplement_intakes')
        .upsert(
          { daily_log_id: log.id, supplement_id: supplementId },
          { onConflict: 'daily_log_id,supplement_id' },
        )
    : await supabase
        .from('log_supplement_intakes')
        .delete()
        .eq('daily_log_id', log.id)
        .eq('supplement_id', supplementId)

  if (error) return failed
  refresh(date)
  return saved
}

export async function addDrink(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const date = field(formData, 'date')
  const volume = Number(field(formData, 'volumeMl'))
  if (!Number.isFinite(volume) || volume <= 0) {
    return { status: 'error', message: 'Enter a volume in millilitres.' }
  }

  const log = await ensureLog(date)
  if (!log) return failed

  const supabase = await createClient()
  const { error } = await supabase.from('log_drinks').insert({
    daily_log_id: log.id,
    kind: field(formData, 'kind') || 'Water',
    volume_ml: Math.round(volume),
    drank_at: optionalTime(formData, 'drankAt'),
  })

  if (error) return failed
  refresh(date)
  return saved
}

export async function removeDrink(id: string, date: string): Promise<SaveState> {
  await requireClient()
  const supabase = await createClient()
  const { error } = await supabase.from('log_drinks').delete().eq('id', id)
  if (error) return failed
  refresh(date)
  return saved
}

/**
 * One restroom visit. The time is optional — remembering that it happened is
 * worth more than remembering when, and a required time is how a day ends up
 * with nothing logged at all.
 *
 * Writes to `log_stools`, which is what the table has been called since the
 * first migration.
 */
export async function addRestroomVisit(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const date = field(formData, 'date')

  const log = await ensureLog(date)
  if (!log) return failed

  const supabase = await createClient()
  const { error } = await supabase.from('log_stools').insert({
    daily_log_id: log.id,
    occurred_at: optionalTime(formData, 'occurredAt'),
    notes: field(formData, 'notes'),
  })

  if (error) return failed
  refresh(date)
  return saved
}

export async function removeRestroomVisit(
  id: string,
  date: string,
): Promise<SaveState> {
  await requireClient()
  const supabase = await createClient()
  const { error } = await supabase.from('log_stools').delete().eq('id', id)
  if (error) return failed
  refresh(date)
  return saved
}

/**
 * Hands the day over: checks the answers the diary asks for and stamps it.
 *
 * Read back off the database rather than trusted from the form, because the
 * sections each save themselves and the button only asks them to hurry up — by
 * the time this runs, what is stored is the truth about the day.
 *
 * Missing answers are reported rather than written around. Nothing is lost
 * either way; the day just is not finished.
 */
export async function postDay(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const date = field(formData, 'date')

  const log = await ensureLog(date)
  if (!log) return failed

  const supabase = await createClient()

  const [{ data: day }, { data: meals }, { data: drinks }, { data: supplements }, { data: taken }] =
    await Promise.all([
      supabase.from('daily_logs').select('*').eq('id', log.id).single(),
      supabase.from('log_meals').select('eaten, eaten_at').eq('daily_log_id', log.id),
      supabase.from('log_drinks').select('id').eq('daily_log_id', log.id).limit(1),
      supabase
        .from('supplements')
        .select('id')
        .eq('client_id', log.clientId)
        .eq('is_active', true),
      supabase
        .from('log_supplement_intakes')
        .select('supplement_id')
        .eq('daily_log_id', log.id)
        .limit(1),
    ])

  if (!day) return failed

  // The same rules the diary's rows draw their pills from, so the button and the
  // list can never disagree about whether a day is finished.
  const missing = missingFromDay({
    wakeTime: day.wake_time,
    weightKg: day.weight_kg === null ? null : Number(day.weight_kg),
    energyLevel: day.energy_level,
    bedTime: day.bed_time,
    drinkCount: (drinks ?? []).length,
    meals: (meals ?? []).map((meal) => ({ eaten: meal.eaten, eatenAt: meal.eaten_at })),
    activeSupplements: (supplements ?? []).length,
    takenSupplements: (taken ?? []).length,
  })

  if (missing.length > 0) {
    return {
      status: 'error',
      message: `Still to fill in: ${asList(missing)}.`,
    }
  }

  const { error } = await supabase
    .from('daily_logs')
    .update({ posted_at: new Date().toISOString() })
    .eq('id', log.id)

  if (error) return failed
  refresh(date)
  return saved
}

