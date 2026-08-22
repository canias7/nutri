import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Logo } from '@/components/logo'
import { getViewer, homePathFor } from '@/lib/auth/session'

const STEPS = [
  {
    title: 'Log the day as it happens',
    detail:
      'Morning weight and mood, every meal with portion and preparation, water, activity, stress, supplements, and how you actually felt.',
  },
  {
    title: 'Your nutritionist reads it',
    detail:
      'Not a calorie count — a specialist looking at your real days and writing recommendations against them.',
  },
  {
    title: 'Talk it through, day by day',
    detail:
      'Questions and answers attached to the day they are about, so nothing gets lost in one long thread.',
  },
]

export default async function Home() {
  const viewer = await getViewer()
  if (viewer) redirect(homePathFor(viewer.profile.role))

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <Logo />
        <Link
          href="/login"
          className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline dark:text-slate-200"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-14 px-5 py-12">
        <section className="flex max-w-2xl flex-col gap-5">
          <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            Nutrition diary &amp; wellbeing coaching
          </span>

          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            The diary your nutritionist actually reads.
          </h1>

          <p className="text-lg text-pretty text-slate-600 dark:text-slate-300">
            Keep an honest record of how you eat, sleep, move and feel. Your
            specialist sees the whole picture and coaches you against it.
          </p>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Start your diary
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-black/10 px-5 py-3 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col gap-2 rounded-2xl border border-black/10 p-5 dark:border-white/10"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-emerald-600/10 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {index + 1}
              </span>
              <h2 className="font-semibold">{step.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">{step.detail}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
