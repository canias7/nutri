import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Check your email · nutri' }

export default async function CheckEmailPage({
  searchParams,
}: PageProps<'/check-email'>) {
  const { email } = await searchParams
  const address = typeof email === 'string' ? email : null

  return (
    <div className="flex flex-col gap-4 text-center">
      <span
        aria-hidden
        className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m3.5 7 8.5 6 8.5-6" strokeLinecap="round" />
        </svg>
      </span>

      <h1 className="text-xl font-semibold tracking-tight">Confirm your email</h1>

      <p className="text-sm text-slate-600 dark:text-slate-400">
        We sent a confirmation link to{' '}
        {address ? (
          <span className="font-semibold text-slate-800 dark:text-slate-100">{address}</span>
        ) : (
          'your inbox'
        )}
        . Open it to finish setting up your account.
      </p>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Nothing yet? It can take a minute, and it sometimes lands in spam.
      </p>

      <Link
        href="/login"
        className="mt-1 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
      >
        Back to sign in
      </Link>
    </div>
  )
}
