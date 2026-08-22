import { createClient } from '@/lib/supabase/server'

/**
 * Placeholder landing page. It doubles as a smoke test: reaching Supabase at
 * all proves the URL, key, cookie plumbing and proxy are wired correctly.
 */
async function checkSupabase() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.getUser()
    // "no session" is the expected answer for a signed-out visitor, and still
    // means the round trip succeeded.
    if (error && error.name !== 'AuthSessionMissingError') {
      return { ok: false, detail: error.message }
    }
    return { ok: true, detail: 'Connected' }
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export default async function Home() {
  const supabaseStatus = await checkSupabase()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-10 px-6 py-20">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-semibold tracking-tight">nutri</h1>
        <p className="text-lg text-black/60 dark:text-white/60">
          Nutrition, tracked simply.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-black/10 p-5 dark:border-white/15">
        <h2 className="text-sm font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
          Setup
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          <StatusRow ok label="Next.js 16, TypeScript and Tailwind CSS v4" />
          <StatusRow
            ok={supabaseStatus.ok}
            label={`Supabase — ${supabaseStatus.detail}`}
          />
        </ul>
      </div>

      <p className="text-sm text-black/50 dark:text-white/50">
        The foundation is in place and waiting on a product. Features land here
        next.
      </p>
    </main>
  )
}

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`}
      />
      <span>{label}</span>
      <span className="sr-only">{ok ? '(ready)' : '(not ready)'}</span>
    </li>
  )
}
