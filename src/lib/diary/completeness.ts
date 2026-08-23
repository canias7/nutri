/**
 * What a day still needs, and which section needs it.
 *
 * Post is the only thing that says what a day is still short of, and it says it
 * once, in a sentence: "Still to fill in: wake-up time, morning weight and what
 * you ate." The rows themselves keep no score — they take one thing from here,
 * `optional`, which decides whether the title wears the red star.
 *
 * The rules live in one place all the same. A row starred as required under a
 * Post that would accept the day is the same contradiction as a row reading Done
 * under a Post that refuses.
 */

export type SectionKey =
  | 'morning'
  | 'water'
  | 'food'
  | 'restroom'
  | 'daytime'
  | 'supplements'
  | 'extras'
  | 'evening'
  | 'complaints'
  | 'discussion'

/** Just enough of a day to judge it, from either the page or the action. */
export type DayFacts = {
  wakeTime: string | null
  weightKg: number | null
  energyLevel: number | null
  bedTime: string | null
  drinkCount: number
  meals: { eaten: string; eatenAt: string | null }[]
  /** Supplements the client keeps, whether or not any were ticked today. */
  activeSupplements: number
  takenSupplements: number
}

export type SectionNeed = {
  /** What is still missing, in Post's words. Empty means the section is done. */
  missing: string[]
  /** True when the section asks for nothing — it accepts, it does not require. */
  optional: boolean
}

/**
 * Every section, in the order the diary lists them.
 *
 * A section with no requirements is still here: the list needs a row for it, and
 * "optional" is a thing worth saying rather than a gap.
 */
export function describeDay(day: DayFacts): Record<SectionKey, SectionNeed> {
  const morning: string[] = []
  if (!day.wakeTime) morning.push('wake-up time')
  if (day.weightKg === null) morning.push('morning weight')
  if (day.energyLevel === null) morning.push('energy level')

  const water: string[] = []
  if (day.drinkCount === 0) water.push('something to drink')

  const food: string[] = []
  if (day.meals.length === 0) food.push('what you ate')
  else if (day.meals.some((meal) => !meal.eaten.trim() || !meal.eatenAt)) {
    // One message for the lot: naming which entry is short would mean numbering
    // entries that are not numbered on screen.
    food.push('what you ate and when, on every entry')
  }

  const supplements: string[] = []
  if (day.activeSupplements > 0 && day.takenSupplements === 0) {
    supplements.push('which supplements you took')
  }

  const evening: string[] = []
  if (!day.bedTime) evening.push('what time you fell asleep')

  return {
    morning: { missing: morning, optional: false },
    water: { missing: water, optional: false },
    food: { missing: food, optional: false },
    // A day with no visit is a real answer, so this asks and never insists.
    restroom: { missing: [], optional: true },
    daytime: { missing: [], optional: true },
    // Only required once there is something to tick.
    supplements: { missing: supplements, optional: day.activeSupplements === 0 },
    extras: { missing: [], optional: true },
    evening: { missing: evening, optional: false },
    complaints: { missing: [], optional: true },
    discussion: { missing: [], optional: true },
  }
}

/** Everything the day is still short of, in list order. */
export function missingFromDay(day: DayFacts): string[] {
  return Object.values(describeDay(day)).flatMap((section) => section.missing)
}

/** "a, b and c" — the way it would be read aloud. */
export function asList(items: string[]): string {
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}
