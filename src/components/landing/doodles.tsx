/**
 * The marks somebody drew on the page.
 *
 * All of it is stroked rather than filled, with round caps and curves that do
 * not quite close — a doodle drawn with a ruler stops reading as a doodle. Every
 * one is decoration, so every one is aria-hidden.
 */

const INK = '#14110E'
const GREEN = '#1B5E3A'
const BLUE = '#2B4CC4'
const RED = '#D8402C'

type Mark = { className?: string }

/** The long curve that points from one thing on the page to another. */
export function CurvedArrow({ className = '' }: Mark) {
  return (
    <svg viewBox="0 0 120 96" fill="none" aria-hidden className={`pointer-events-none absolute ${className}`}>
      <path
        d="M6 8C34 6 78 18 92 52c3 8 4 16 3 24"
        stroke={INK}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Two strokes rather than a filled head, so it stays a drawing. */}
      <path d="M83 66c4 8 8 14 12 18" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M110 70c-7 6-12 10-15 14" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

/** Five points, drawn in one wobbly stroke without lifting the pen. */
export function Star({ className = '', color = BLUE }: Mark & { color?: string }) {
  return (
    <svg viewBox="0 0 44 44" fill="none" aria-hidden className={`pointer-events-none absolute ${className}`}>
      <path
        d="M22 4l11.5 34L4.5 17h35L10.5 38 22 4z"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A heart, drawn quickly. */
export function Heart({ className = '', color = RED }: Mark & { color?: string }) {
  return (
    <svg viewBox="0 0 44 40" fill="none" aria-hidden className={`pointer-events-none absolute ${className}`}>
      <path
        d="M22 35C13 28 4 22 4 14 4 8 8.5 4 13.5 4 17 4 20 6 22 9c2-3 5-5 8.5-5C35.5 4 40 8 40 14c0 8-9 14-18 21z"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** The little burst you put over something you are pleased with. */
export function Sparks({ className = '', color = RED }: Mark & { color?: string }) {
  return (
    <svg viewBox="0 0 48 34" fill="none" aria-hidden className={`pointer-events-none absolute ${className}`}>
      <path d="M8 30L4 6" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M23 28L23 3" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M38 30L44 7" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

/**
 * The stroke under a word you meant.
 *
 * One pass by default — a single confident swash, drawn slightly uphill the way
 * a hand does it. `double` adds the second, lighter pass for smaller headings,
 * where one stroke alone reads as a rule rather than a mark.
 */
export function Underline({
  className = '',
  color = GREEN,
  double = false,
  weight = 7,
}: Mark & { color?: string; double?: boolean; weight?: number }) {
  return (
    <svg
      viewBox="0 0 300 20"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
    >
      <path
        d="M3 14C60 7 132 4 189 5c40 1 78 3 108 6"
        stroke={color}
        strokeWidth={weight}
        strokeLinecap="round"
      />
      {double ? (
        <path
          d="M16 19c44-4 98-5 146-4 42 1 84 3 126 5"
          stroke={color}
          strokeWidth={weight * 0.45}
          strokeLinecap="round"
          opacity="0.6"
        />
      ) : null}
    </svg>
  )
}

/** The dashes people draw either side of something to make it shout. */
export function Cheer({ className = '', flip = false }: Mark & { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 34 44"
      fill="none"
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M30 8L6 3" stroke={GREEN} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M30 22H4" stroke={GREEN} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M30 36L6 41" stroke={GREEN} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

/**
 * A postage stamp, the kind stuck in a scrapbook.
 *
 * The perforation is circles in the page's own colour punched along each edge,
 * which is cheaper than a mask and survives being scaled.
 */
export function Stamp({
  className = '',
  page = '#FFFFFF',
  top = 'FRESH',
  bottom = 'GOOD FOOD',
}: Mark & { page?: string; top?: string; bottom?: string }) {
  const perfs = []
  for (let x = 8; x <= 112; x += 13) {
    perfs.push(<circle key={`t${x}`} cx={x} cy="2" r="4.4" fill={page} />)
    perfs.push(<circle key={`b${x}`} cx={x} cy="138" r="4.4" fill={page} />)
  }
  for (let y = 8; y <= 132; y += 13) {
    perfs.push(<circle key={`l${y}`} cx="2" cy={y} r="4.4" fill={page} />)
    perfs.push(<circle key={`r${y}`} cx="118" cy={y} r="4.4" fill={page} />)
  }

  return (
    <svg viewBox="0 0 120 140" aria-hidden className={`pointer-events-none absolute ${className}`}>
      <rect x="2" y="2" width="116" height="136" fill="#F3EFE3" />
      <rect x="9" y="9" width="102" height="122" fill="none" stroke="#C8BFA6" strokeWidth="1.2" />
      {perfs}

      {/* A radish: enough of one to be read as a drawing of a radish. */}
      <path d="M60 62c11 0 19 9 19 20s-9 21-19 21-19-10-19-21 8-20 19-20z" fill={RED} />
      <path d="M60 62c-2-9-8-14-16-16 7-4 14-1 17 6 3-7 10-10 17-6-8 2-14 7-16 16z" fill={GREEN} />
      <path d="M60 62v-16" stroke={GREEN} strokeWidth="2" strokeLinecap="round" />

      <text
        x="60"
        y="34"
        textAnchor="middle"
        fill={INK}
        className="text-[15px] font-semibold tracking-[0.14em]"
      >
        {top}
      </text>
      <text
        x="60"
        y="124"
        textAnchor="middle"
        fill={INK}
        className="text-[13px] font-semibold tracking-[0.12em]"
      >
        {bottom}
      </text>
    </svg>
  )
}
