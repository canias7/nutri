import type { Metadata } from 'next'

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = { title: 'Reset your password · nutri' }

export default function ForgotPasswordPage() {
  return (
    <>
      <header className="mb-5 flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          We&apos;ll email you a link to set a new one.
        </p>
      </header>
      <ForgotPasswordForm />
    </>
  )
}
