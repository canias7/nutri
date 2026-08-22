'use client'

import { useRef, useState } from 'react'

import { useUnits } from '@/components/units/unit-provider'
import { formatNumber } from '@/lib/format'
import { formatWeight } from '@/lib/units'

export type PosterData = {
  dateLabel: string
  name: string
  weightKg: number | null
  waterMl: number
  waterTargetMl: number
  energy: number | null
  stress: number | null
  sectionsDone: number
  sectionsTotal: number
  meals: { label: string; eaten: string }[]
}

const W = 1080
const H = 1350
const INK = '#14201a'
const MUTED = '#66766c'
const ACCENT = '#059669'

/**
 * Renders the day as an image the client can keep or send on.
 *
 * Drawn straight to a canvas rather than screenshotting the DOM: it is a
 * different composition from the screen anyway — portrait, larger type, framed —
 * and it avoids pulling in a rasteriser to reproduce a layout nobody wants at
 * that size.
 */
export function DayPoster({ data }: { data: PosterData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { system } = useUnits()

  async function build() {
    setBusy(true)
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    // Brand bar
    ctx.fillStyle = ACCENT
    ctx.fillRect(0, 0, W, 16)

    let y = 120
    ctx.fillStyle = ACCENT
    ctx.font = 'bold 34px system-ui, sans-serif'
    ctx.fillText('nutri', 80, y)

    y += 90
    ctx.fillStyle = INK
    ctx.font = 'bold 68px system-ui, sans-serif'
    ctx.fillText(data.dateLabel, 80, y)

    y += 52
    ctx.fillStyle = MUTED
    ctx.font = '32px system-ui, sans-serif'
    ctx.fillText(data.name, 80, y)

    // Headline figures
    y += 90
    const stats: [string, string][] = [
      ['Water', `${formatNumber(data.waterMl)} / ${formatNumber(data.waterTargetMl)} ml`],
      ['Weight', data.weightKg === null ? '—' : formatWeight(data.weightKg, system)],
      ['Energy', data.energy === null ? '—' : `${data.energy}/10`],
      ['Stress', data.stress === null ? '—' : `${data.stress}/10`],
    ]

    for (const [label, value] of stats) {
      ctx.fillStyle = '#f1f5f3'
      roundedRect(ctx, 80, y, W - 160, 108, 20)
      ctx.fill()

      ctx.fillStyle = MUTED
      ctx.font = '600 26px system-ui, sans-serif'
      ctx.fillText(label.toUpperCase(), 116, y + 44)

      ctx.fillStyle = INK
      ctx.font = 'bold 44px system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(value, W - 116, y + 70)
      ctx.textAlign = 'left'

      y += 128
    }

    // Meals
    const eaten = data.meals.filter((meal) => meal.eaten.trim())
    if (eaten.length > 0) {
      y += 24
      ctx.fillStyle = MUTED
      ctx.font = '600 26px system-ui, sans-serif'
      ctx.fillText('WHAT I ATE', 80, y)
      y += 46

      for (const meal of eaten) {
        ctx.fillStyle = ACCENT
        ctx.font = 'bold 30px system-ui, sans-serif'
        ctx.fillText(meal.label, 80, y)
        y += 40

        ctx.fillStyle = INK
        ctx.font = '30px system-ui, sans-serif'
        y = wrap(ctx, meal.eaten, 80, y, W - 160, 42)
        y += 26

        if (y > H - 230) break
      }
    }

    // Footer
    ctx.fillStyle = MUTED
    ctx.font = '28px system-ui, sans-serif'
    ctx.fillText(
      `${data.sectionsDone} of ${data.sectionsTotal} sections logged`,
      80,
      H - 130,
    )
    ctx.fillStyle = ACCENT
    ctx.font = '600 28px system-ui, sans-serif'
    ctx.fillText('Kept in nutri — my nutrition diary', 80, H - 80)

    setUrl(canvas.toDataURL('image/png'))
    setBusy(false)
  }

  async function share() {
    if (!url || !canvasRef.current) return
    const blob = await new Promise<Blob | null>((resolve) =>
      canvasRef.current?.toBlob(resolve, 'image/png'),
    )
    if (!blob) return

    const file = new File([blob], `nutri-${data.dateLabel}.png`, { type: 'image/png' })
    // Not every browser can share files; the download link below always works.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] })
      } catch {
        // Cancelled, which is not an error worth reporting.
      }
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <header className="mb-3 flex flex-col gap-0.5">
        <h2 className="font-semibold">Share this day</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Turns the day into an image you can save or send on.
        </p>
      </header>

      {!url ? (
        <button
          type="button"
          onClick={build}
          disabled={busy}
          className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/5"
        >
          {busy ? 'Drawing…' : 'Create image'}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Summary of ${data.dateLabel}`}
            className="w-full max-w-xs rounded-xl border border-black/10 dark:border-white/10"
          />
          <div className="flex flex-wrap gap-2">
            <a
              href={url}
              download={`nutri-${data.dateLabel}.png`}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Download
            </a>
            <button
              type="button"
              onClick={share}
              className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5"
            >
              Share
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </section>
  )
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Wraps text to the given width and returns the next free y. */
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(/\s+/)
  let line = ''

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, x, y)
      y += lineHeight
      line = word
    } else {
      line = candidate
    }
  }
  if (line) {
    ctx.fillText(line, x, y)
    y += lineHeight
  }
  return y
}
