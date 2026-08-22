/**
 * How many photos one food entry carries.
 *
 * Enforced in the database too — the cap is a rule about the data, not about
 * the form. Kept out of the action file because a 'use server' module may only
 * export async functions, and a constant there fails the first time a client
 * component reaches for it.
 */
export const MAX_MEAL_PHOTOS = 5
