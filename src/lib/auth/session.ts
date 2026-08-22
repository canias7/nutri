import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'

export type Profile = Tables<'profiles'>
export type ClientRow = Tables<'clients'>
export type NutritionistRow = Tables<'nutritionists'>

export type Viewer = {
  id: string
  email: string | null
  profile: Profile
}

/** Where a signed-in user belongs, given their role. */
export function homePathFor(role: Profile['role']): string {
  return role === 'nutritionist' ? '/coach' : '/dashboard'
}

/**
 * The signed-in user and their profile, or null.
 *
 * Always `getUser()`, never `getSession()`: the session comes straight off a
 * cookie the browser could have written, while getUser revalidates it.
 */
export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // The signup trigger creates the profile, so a missing one means a genuinely
  // broken account rather than a race worth retrying.
  if (!profile) return null

  return { id: user.id, email: user.email ?? null, profile }
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer()
  if (!viewer) redirect('/login')
  return viewer
}

/** A client and their onboarding record; nutritionists are sent to their own area. */
export async function requireClient(): Promise<{
  viewer: Viewer
  client: ClientRow
}> {
  const viewer = await requireViewer()
  if (viewer.profile.role !== 'client') redirect(homePathFor(viewer.profile.role))

  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('profile_id', viewer.id)
    .single()

  if (!client) redirect('/login')
  return { viewer, client }
}

export async function requireCoach(): Promise<{
  viewer: Viewer
  nutritionist: NutritionistRow
}> {
  const viewer = await requireViewer()
  if (viewer.profile.role !== 'nutritionist') {
    redirect(homePathFor(viewer.profile.role))
  }

  const supabase = await createClient()
  const { data: nutritionist } = await supabase
    .from('nutritionists')
    .select('*')
    .eq('profile_id', viewer.id)
    .single()

  if (!nutritionist) redirect('/login')
  return { viewer, nutritionist }
}

/** Onboarding is finished once the client has answered the starting questionnaire. */
export function hasCompletedOnboarding(client: ClientRow): boolean {
  return client.onboarding_completed_at !== null
}
