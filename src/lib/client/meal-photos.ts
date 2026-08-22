'use client'

import { createClient } from '@/lib/supabase/client'

export const MEAL_PHOTO_BUCKET = 'meal-photos'
/** Matches the bucket's own limit, so a too-big file is refused before upload. */
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

export type UploadResult =
  | { ok: true; path: string }
  | { ok: false; message: string }

/**
 * Puts a photo in the bucket and hands back its object name.
 *
 * Uploaded straight from the browser rather than through a Server Action: an
 * eight-megabyte phone photo would otherwise be posted to the Worker and
 * forwarded on, for no gain — the storage rules check the caller either way.
 *
 * The name starts with the client's own id, which is what those rules key on:
 * you may write under your own folder and nowhere else.
 */
export async function uploadMealPhoto(
  file: File,
  clientId: string,
): Promise<UploadResult> {
  const extension = EXTENSIONS[file.type]
  if (!extension) {
    return { ok: false, message: 'That has to be a photo — JPEG, PNG or HEIC.' }
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, message: 'That photo is over 8 MB. Try a smaller one.' }
  }

  const supabase = createClient()
  const path = `${clientId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from(MEAL_PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return { ok: false, message: 'Could not upload that. Try again.' }
  return { ok: true, path }
}

/**
 * Best effort. A file left behind costs a few kilobytes; a removal that failed
 * loudly in the middle of typing costs the reader their place.
 */
export async function deleteMealPhoto(path: string): Promise<void> {
  if (!path) return
  const supabase = createClient()
  await supabase.storage.from(MEAL_PHOTO_BUCKET).remove([path])
}
