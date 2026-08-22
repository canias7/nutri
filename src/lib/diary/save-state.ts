/**
 * Shared shape for the diary's autosaving sections.
 *
 * Kept out of actions.ts deliberately: a "use server" module may export nothing
 * but async functions. Exporting a constant from one fails at runtime the first
 * time a client component reaches for it — and only then, so it survives every
 * build and typecheck and shows up as a crash while someone is typing.
 */
export type SaveState = { status: 'idle' | 'saved' | 'error'; message?: string }

export const idleSaveState: SaveState = { status: 'idle' }
