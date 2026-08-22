import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Enums, Tables } from '@/lib/supabase/database.types'

export type DailyLog = Tables<'daily_logs'>
export type LogMeal = Tables<'log_meals'>
export type LogDrink = Tables<'log_drinks'>
export type LogStool = Tables<'log_stools'>
export type Supplement = Tables<'supplements'>
export type MealSlot = Enums<'meal_slot'>

/** The meals the diet section asks about, in the order they happen. */
export const MEAL_SLOTS = [
  { slot: 'breakfast', label: 'Breakfast', defaultTime: '08:30' },
  { slot: 'second_breakfast', label: 'Second breakfast', defaultTime: '11:00' },
  { slot: 'lunch', label: 'Lunch', defaultTime: '13:00' },
  { slot: 'snack', label: 'Snack', defaultTime: '16:00' },
  { slot: 'dinner', label: 'Dinner', defaultTime: '19:00' },
] as const satisfies ReadonlyArray<{
  slot: MealSlot
  label: string
  defaultTime: string
}>

export type DiaryDay = {
  log: DailyLog | null
  meals: LogMeal[]
  drinks: LogDrink[]
  stools: LogStool[]
  supplements: Supplement[]
  takenSupplementIds: string[]
}

/**
 * Everything one day of the diary needs, in a single round trip per table.
 *
 * The log may legitimately be null: a day nobody has touched yet has no row,
 * and one is only created when the first section is saved.
 */
export async function getDiaryDay(
  clientId: string,
  date: string,
): Promise<DiaryDay> {
  const supabase = await createClient()

  const [{ data: log }, { data: supplements }] = await Promise.all([
    supabase
      .from('daily_logs')
      .select('*')
      .eq('client_id', clientId)
      .eq('log_date', date)
      .maybeSingle(),
    supabase
      .from('supplements')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('sort_order')
      .order('created_at'),
  ])

  if (!log) {
    return {
      log: null,
      meals: [],
      drinks: [],
      stools: [],
      supplements: supplements ?? [],
      takenSupplementIds: [],
    }
  }

  const [{ data: meals }, { data: drinks }, { data: stools }, { data: taken }] =
    await Promise.all([
      supabase.from('log_meals').select('*').eq('daily_log_id', log.id),
      supabase
        .from('log_drinks')
        .select('*')
        .eq('daily_log_id', log.id)
        .order('created_at'),
      supabase
        .from('log_stools')
        .select('*')
        .eq('daily_log_id', log.id)
        .order('created_at'),
      supabase
        .from('log_supplement_intakes')
        .select('supplement_id')
        .eq('daily_log_id', log.id),
    ])

  return {
    log,
    meals: meals ?? [],
    drinks: drinks ?? [],
    stools: stools ?? [],
    supplements: supplements ?? [],
    takenSupplementIds: (taken ?? []).map((row) => row.supplement_id),
  }
}

/** The last `days` days of logs, most recent first. */
export async function getRecentLogs(
  clientId: string,
  days = 14,
): Promise<DailyLog[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('client_id', clientId)
    .order('log_date', { ascending: false })
    .limit(days)

  return data ?? []
}

/** Which of a day's sections have anything in them. */
export type SectionKey =
  | 'morning'
  | 'diet'
  | 'daytime'
  | 'supplements'
  | 'evening'
  | 'complaints'

export const SECTION_LABELS: Record<SectionKey, string> = {
  morning: 'Morning',
  diet: 'Diet & water',
  daytime: 'Activity & stress',
  supplements: 'Supplements',
  evening: 'Evening',
  complaints: 'Well-being',
}

export function completedSections(day: DiaryDay): Set<SectionKey> {
  const done = new Set<SectionKey>()
  const log = day.log
  if (!log) return done

  if (log.wake_time || log.waking_mood || log.weight_kg || log.energy_level) {
    done.add('morning')
  }
  if (day.meals.some((meal) => meal.eaten.trim()) || day.drinks.length > 0) {
    done.add('diet')
  }
  if (
    log.activity_type ||
    log.activity_minutes ||
    log.stress_level !== null ||
    log.outdoor_minutes
  ) {
    done.add('daytime')
  }
  if (day.takenSupplementIds.length > 0 || log.extra_supplements) {
    done.add('supplements')
  }
  if (log.evening_ritual || log.gadgets_off_at || log.bed_time) {
    done.add('evening')
  }
  if (
    log.complaint_emotional ||
    log.complaint_skin ||
    log.complaint_digestion ||
    log.complaint_other
  ) {
    done.add('complaints')
  }

  return done
}
