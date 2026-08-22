'use server'

import { revalidatePath } from 'next/cache'

import { requireClient } from '@/lib/auth/session'
import { field } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'
import type { TablesUpdate } from '@/lib/supabase/database.types'

import { isValidDateParam } from './date'
import type { MealSlot } from './queries'
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
    complaint_emotional: field(formData, 'complaintEmotional'),
    complaint_skin: field(formData, 'complaintSkin'),
    complaint_digestion: field(formData, 'complaintDigestion'),
    complaint_other: field(formData, 'complaintOther'),
  })
}

export async function saveMeal(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const date = field(formData, 'date')
  const slot = field(formData, 'slot') as MealSlot

  const log = await ensureLog(date)
  if (!log) return failed

  const supabase = await createClient()
  const { error } = await supabase.from('log_meals').upsert(
    {
      daily_log_id: log.id,
      slot,
      eaten: field(formData, 'eaten'),
      amount: field(formData, 'amount'),
      method: field(formData, 'method'),
      eaten_at: optionalTime(formData, 'eatenAt'),
    },
    { onConflict: 'daily_log_id,slot' },
  )

  if (error) return failed
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
    // Only clean water counts toward the hydration target.
    counts_as_water: field(formData, 'countsAsWater') === 'on',
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

export async function addStool(
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

export async function removeStool(id: string, date: string): Promise<SaveState> {
  await requireClient()
  const supabase = await createClient()
  const { error } = await supabase.from('log_stools').delete().eq('id', id)
  if (error) return failed
  refresh(date)
  return saved
}
