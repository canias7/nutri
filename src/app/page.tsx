import { Caveat, Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CurvedArrow, Cheer, Heart, Sparks, Star, Underline } from '@/components/landing/doodles'
import { Cutout, PaperGrain, Scrap, TornEdge, TornStrip } from '@/components/landing/paper'
import { getViewer, homePathFor } from '@/lib/auth/session'

// Scoped to this page rather than the root layout: the app itself is set in
// Geist and has no use for a Didone or a handwriting face.
const display = Playfair_Display({ subsets: ['latin'], weight: ['700', '900'] })
const hand = Caveat({ subsets: ['latin'], weight: ['400', '600'] })

/** The collage's palette. Paper, ink, and three things you'd find in a fridge. */
const PAGE = '#FFFFFF'
const INK = '#14110E'
const GREEN = '#1B5E3A'
const LEAF = '#A8C58B'
const BLUE = '#2B4CC4'
const BODY = '#57534B'

const PROMISES = [
  {
    title: 'Write it down.',
    detail:
      'Morning weight, what you actually ate, water, how you slept. Two minutes on your phone, as the day happens.',
    fill: LEAF,
    art: { src: '/landing/lemon.webp', width: 460, height: 319 },
  },
  {
    title: 'Be understood.',
    detail:
      'Not a calorie total. A specialist reading your real days — the late dinners, the bad nights, the afternoon slump.',
    fill: '#E4DFCE',
    art: { src: '/landing/hand-holding-greens.webp', width: 460, height: 268 },
  },
  {
    title: 'Feel the change.',
    detail:
      'Recommendations written against what you recorded, and a thread to ask about any day you want to talk through.',
    fill: BLUE,
    art: { src: '/landing/watering-can-sprout.webp', width: 460, height: 293 },
  },
]

export default async function Home() {
  const viewer = await getViewer()
  if (viewer) redirect(homePathFor(viewer.profile.role))

  return (
    // The page paints its own ground and keeps it in every theme. A collage of
    // torn paper has one lighting condition; inverted, it is a different object.
    <div
      className="relative isolate flex flex-1 flex-col overflow-hidden"
      style={{ background: PAGE, color: INK }}
    >
      <PaperGrain />

      <header
        className="relative z-20 border-b"
        style={{ borderColor: '#E8E4DA' }}
      >
       <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3.5">
        <span
          className={`${display.className} text-3xl font-black leading-none tracking-tight sm:text-[2.1rem]`}
          style={{ color: GREEN }}
        >
          nutri
          {/* The sprout on the ‘i’, which is where the logo's leaf lives. */}
          <svg viewBox="0 0 20 14" aria-hidden className="ml-0.5 inline-block h-4 w-5 align-super">
            <path d="M10 13C10 6 14 2 19 1c0 7-4 11-9 12z" fill={GREEN} />
            <path d="M10 13C10 7 6 3 1 2c0 6 4 10 9 11z" fill={LEAF} />
          </svg>
        </span>

        <nav className="flex items-center gap-5 text-[15px] font-semibold sm:gap-7">
          {/* Only destinations that exist. A nav bar of dead links is worse than
              a short one. */}
          <a href="#how" className="hidden hover:underline sm:inline" style={{ color: BODY }}>
            How it works
          </a>
          <Link href="/login" className="hover:underline" style={{ color: BODY }}>
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md px-4 py-2 text-white transition hover:brightness-110"
            style={{ background: GREEN }}
          >
            Start free
          </Link>
        </nav>
       </div>
      </header>

      {/* ------------------------------- hero ------------------------------- */}
      <section className="relative isolate overflow-hidden px-5 pb-16 pt-10 sm:pb-24 sm:pt-14">
        {/* Left cluster. Hidden on phones — a collage needs room, and a phone
            gives the words all of it. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[27%] max-w-[400px] lg:block">
          {/* Paper first, then the things resting on it. Several run off the
              left edge on purpose — a collage that stops at the margin reads as
              a row of stickers. */}
          <Scrap size="large" fill={LEAF} className="left-[-14%] top-[4%] h-[44%] w-[74%]" />
          <Scrap size="medium" fill={BLUE} className="bottom-[12%] left-[34%] h-[24%] w-[46%]" />
          <Scrap size="medium" fill="#4E7A3A" className="bottom-[2%] left-[-16%] h-[30%] w-[52%]" />

          <Cutout src="/landing/tomato.webp" width={420} height={460} eager
            className="left-[-8%] top-[2%] w-[52%]" />
          <Cutout src="/landing/kale-leaf.webp" width={440} height={652}
            className="bottom-[-2%] left-[-12%] w-[46%]" />
          <Cutout src="/landing/cucumber-slice.webp" width={360} height={280}
            className="bottom-[8%] left-[28%] w-[40%]" />

          <CurvedArrow className="left-[44%] top-[20%] h-24 w-28" />

          {/* The kind of note somebody actually writes in a diary. */}
          <div
            className="absolute left-[16%] top-[46%] w-[64%] rotate-[-4deg] px-6 py-5 shadow-sm"
            style={{ background: '#F5F1E4' }}
          >
            <p className={`${hand.className} text-2xl leading-snug`} style={{ color: INK }}>
              Bloated after lunch.
              <br />
              Slept badly again.
              <br />
              Ask about this!
            </p>
            <Heart className="bottom-1 right-4 h-6 w-6" />
          </div>
        </div>

        {/* Right cluster. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[27%] max-w-[420px] lg:block">
          <Scrap size="large" fill={BLUE} className="right-[-6%] top-[2%] h-[48%] w-[54%]" />
          <Scrap size="medium" fill={LEAF} className="bottom-[4%] right-[22%] h-[28%] w-[56%]" />

          {/* The photograph the page is really built around, so it is the only
              one that loads eagerly. */}
          <Cutout src="/landing/nutritionist-with-bowl.webp" width={660} height={908} eager
            className="bottom-0 left-[2%] w-[86%]" />
          <Cutout src="/landing/fresh-food-stamp.webp" width={320} height={355}
            className="right-[-2%] top-[4%] w-[32%] rotate-[5deg]" />
          <Cutout src="/landing/botanical-leaves.webp" width={460} height={409}
            className="right-[-8%] top-[36%] w-[34%]" />
          <Cutout src="/landing/broccoli.webp" width={360} height={328}
            className="bottom-[2%] right-[-10%] w-[36%]" />

          <Star className="bottom-[30%] right-[10%] h-8 w-8" color={GREEN} />
        </div>

        {/* The words, which sit above all of it. */}
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
          <Sparks className="left-[8%] top-[-8px] h-8 w-11 sm:left-[14%]" />
          <Star className="right-[4%] top-6 hidden h-9 w-9 sm:block" />

          {/* Short lines on purpose. The reference's drama comes from setting
              eleven characters at 7rem; a longer line has to shrink to clear the
              collage, and shrinking is what stops it looking like the reference. */}
          <h1
            className={`${display.className} text-[16vw] font-black leading-[0.86] tracking-[-0.02em] sm:text-[6rem] lg:text-[7rem]`}
          >
            Count less.
            {/* The padding is what the swash hangs from: with leading below 1 the
                glyphs overflow their line box, so `bottom` alone lands halfway up
                the letters. */}
            <span className="relative block pb-5 sm:pb-8">
              Know more.
              <Underline className="inset-x-[6%] bottom-0 h-5 w-[88%] sm:h-7" weight={9} />
            </span>
          </h1>

          <p
            className="mt-4 max-w-md text-pretty text-lg leading-relaxed sm:mt-6"
            style={{ color: BODY }}
          >
            Write down how you eat, sleep and feel. A nutritionist reads every day
            and tells you what to change.
          </p>

          <div className="relative mt-9 sm:mt-11">
            <Cheer className="-left-10 top-2 h-11 w-8" />
            <Cheer className="-right-10 top-2 h-11 w-8" flip />
            <Link
              href="/signup"
              className="relative inline-flex items-center justify-center px-14 py-5 text-lg font-semibold text-white transition hover:brightness-110"
            >
              {/* The button is a torn strip of green paper, not a rounded rect. */}
              <TornStrip fill={GREEN} className="inset-0 size-full" />
              <span className="relative">Start your diary</span>
            </Link>
          </div>

          <p className="mt-5 text-sm" style={{ color: BODY }}>
            Free while it is just you and your nutritionist.
          </p>
        </div>

        <TornEdge above={PAGE} />
      </section>

      {/* ----------------------------- promises ----------------------------- */}
      <section id="how" className="relative mx-auto w-full max-w-6xl px-5 py-14 sm:py-20">
        <h2 className="sr-only">How it works</h2>
        <ul className="grid gap-12 sm:grid-cols-3 sm:gap-0">
          {PROMISES.map((promise, index) => (
            <li
              key={promise.title}
              className={`relative flex flex-col items-center px-2 text-center sm:px-7 ${
                index > 0 ? 'sm:border-l' : ''
              }`}
              style={index > 0 ? { borderColor: '#DDD6C4' } : undefined}
            >
              <h3
                className={`${display.className} text-4xl font-black tracking-tight sm:text-[2.6rem]`}
                style={{ color: GREEN }}
              >
                {promise.title}
              </h3>

              {/* Torn paper behind, the cut-out resting on it and overhanging
                  the bottom, which is what stops the pair reading as a card. */}
              <div className="relative mt-6 h-40 w-full max-w-[260px]">
                <Scrap size="small" fill={promise.fill} className="inset-x-5 bottom-4 h-[64%]" />
                <Cutout
                  src={promise.art.src}
                  width={promise.art.width}
                  height={promise.art.height}
                  className="bottom-0 left-1/2 w-[88%] -translate-x-1/2 drop-shadow-sm"
                />
                {index === 0 ? <Underline className="inset-x-6 -top-4 h-4 w-3/4" double weight={4} /> : null}
                {index === 1 ? <Heart className="-left-2 top-0 h-7 w-7" /> : null}
                {/* Outside the block, not on it — a blue star on blue paper is
                    an invisible star. */}
                {index === 2 ? <Star className="-right-3 -top-3 h-8 w-8" /> : null}
              </div>

              <p className="mt-7 max-w-xs text-pretty text-[15px] leading-relaxed" style={{ color: BODY }}>
                {promise.detail}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------ closing ----------------------------- */}
      <section className="relative mt-auto px-5 pb-14 pt-4 text-center">
        <p className={`${hand.className} text-3xl`} style={{ color: GREEN }}>
          One honest day at a time.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold">
          <Link
            href="/signup"
            className="rounded-md px-5 py-2.5 text-white transition hover:brightness-110"
            style={{ background: GREEN }}
          >
            Start your diary
          </Link>
          <Link href="/login" className="hover:underline" style={{ color: BODY }}>
            I already have an account
          </Link>
        </div>
      </section>
    </div>
  )
}
