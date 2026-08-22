export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid size-8 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
          {/* A leaf: the app is a food and wellbeing diary. */}
          <path
            d="M20 4c0 9-5.5 14-12 14a7 7 0 0 1 0-14c4 0 7-1.5 12 0Z"
            fill="currentColor"
            opacity=".95"
          />
          <path
            d="M4 21c3-6 7-9.5 12-11.5"
            stroke="white"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="text-lg font-semibold tracking-tight">nutri</span>
    </span>
  )
}
