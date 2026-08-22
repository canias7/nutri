import type { CSSProperties, ReactNode } from 'react'

/**
 * The paper the landing page is made of.
 *
 * Every edge here is a fixed path rather than a generated one. A torn edge wants
 * to look random, but generating it at render time gives the server and the
 * browser different paths and React replaces the markup on hydration — so these
 * were generated once, offline, and pasted in.
 */

/** The main tear: paper above, whatever is underneath showing through below. */
const TORN_EDGE =
  'M0,26 Q12.0,29.8 24,12.6 Q36.0,12.6 48,31.3 Q60.0,31.3 72,22.1 Q84.0,22.1 96,5.4 Q108.0,5.4 120,27.2 Q132.0,27.2 144,23.4 Q156.0,23.4 168,24.3 Q180.0,24.3 192,17.9 Q204.0,17.9 216,20.2 Q228.0,20.2 240,27.3 Q252.0,27.3 264,17.7 Q276.0,17.7 288,33.7 Q300.0,33.7 312,33.4 Q324.0,33.4 336,26.6 Q348.0,26.6 360,21.4 Q372.0,21.4 384,25.1 Q396.0,25.1 408,31.6 Q420.0,31.6 432,18 Q444.0,18 456,8.7 Q468.0,8.7 480,22.2 Q492.0,22.2 504,25.3 Q516.0,25.3 528,28.4 Q540.0,28.4 552,19.7 Q564.0,19.7 576,23 Q588.0,23 600,27.6 Q612.0,27.6 624,23 Q636.0,23 648,32.4 Q660.0,32.4 672,16 Q684.0,16 696,28.9 Q708.0,28.9 720,25.4 Q732.0,25.4 744,23.8 Q756.0,23.8 768,19.3 Q780.0,19.3 792,24.3 Q804.0,24.3 816,33.7 Q828.0,33.7 840,17.7 Q852.0,17.7 864,32.2 Q876.0,32.2 888,17 Q900.0,17 912,13.2 Q924.0,13.2 936,20.6 Q948.0,20.6 960,18.6 Q972.0,18.6 984,29 Q996.0,29 1008,34.7 Q1020.0,34.7 1032,18.9 Q1044.0,18.9 1056,18 Q1068.0,18 1080,19.5 Q1092.0,19.5 1104,21.8 Q1116.0,21.8 1128,28.9 Q1140.0,28.9 1152,30.6 Q1164.0,30.6 1176,22.9 Q1188.0,22.9 1200,27 Q1212.0,27 1224,27.2 Q1236.0,27.2 1248,21.1 Q1260.0,21.1 1272,30.5 Q1284.0,30.5 1296,27.4 Q1308.0,27.4 1320,28.1 Q1332.0,28.1 1344,6.3 Q1356.0,6.3 1368,27 Q1380.0,27 1392,25.4 Q1404.0,25.4 1416,23.5 Q1428.0,23.5 1440,23'

/** A second tear, offset, so the fold reads as two sheets rather than one line. */
const TORN_EDGE_UNDER =
  'M0,20 Q15.5,9.1 31,5.9 Q46.5,5.9 62,16.8 Q77.5,16.8 93,16.3 Q108.5,16.3 124,24.6 Q139.5,24.6 155,26.3 Q170.5,26.3 186,24.9 Q201.5,24.9 217,8.4 Q232.5,8.4 248,16.6 Q263.5,16.6 279,22 Q294.5,22 310,16.2 Q325.5,16.2 341,22.5 Q356.5,22.5 372,19.7 Q387.5,19.7 403,15.9 Q418.5,15.9 434,22.6 Q449.5,22.6 465,19.4 Q480.5,19.4 496,23.9 Q511.5,23.9 527,23.8 Q542.5,23.8 558,19.8 Q573.5,19.8 589,17 Q604.5,17 620,19.4 Q635.5,19.4 651,16 Q666.5,16 682,24.4 Q697.5,24.4 713,23.4 Q728.5,23.4 744,11.1 Q759.5,11.1 775,17.5 Q790.5,17.5 806,2.6 Q821.5,2.6 837,10 Q852.5,10 868,23.1 Q883.5,23.1 899,17.9 Q914.5,17.9 930,12.5 Q945.5,12.5 961,19.9 Q976.5,19.9 992,26.4 Q1007.5,26.4 1023,26.6 Q1038.5,26.6 1054,26.5 Q1069.5,26.5 1085,17.9 Q1100.5,17.9 1116,25.7 Q1131.5,25.7 1147,12.7 Q1162.5,12.7 1178,17 Q1193.5,17 1209,13.7 Q1224.5,13.7 1240,20.6 Q1255.5,20.6 1271,24.6 Q1286.5,24.6 1302,17.7 Q1317.5,17.7 1333,15.6 Q1348.5,15.6 1364,22 Q1379.5,22 1395,24.2 Q1417.5,24.2 1440,15.9'

/**
 * The bottom of a band, torn away to show the next one.
 *
 * `above` is the colour of the sheet being torn; the strip sits at the band's
 * bottom edge and the page behind it shows through the tear.
 */
export function TornEdge({ above = '#FBFAF6' }: { above?: string }) {
  return (
    <svg
      viewBox="0 0 1440 40"
      preserveAspectRatio="none"
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-6 w-full sm:h-9"
    >
      {/* The under-sheet peeks out of the tear, a shade darker. */}
      <path d={`${TORN_EDGE_UNDER} L1440,0 L0,0 Z`} fill="#EDE7DA" />
      <path d={`${TORN_EDGE} L1440,0 L0,0 Z`} fill={above} />
    </svg>
  )
}

/** Torn scraps, in three sizes. Fixed outlines, for the same reason as above. */
const SCRAPS = {
  large: {
    box: '0 0 220 260',
    d: 'M0,2.3 L26,0.3 L52,10.3 L78,6.4 L104,0.8 L130,10 L156,6.1 L182,0.8 L208,8.5 L208.2,0 L215,26 L211,52 L216.7,78 L213.1,104 L219.6,130 L210.2,156 L209.6,182 L215.4,208 L210.1,234 L220,253.6 L194,254.9 L168,248.8 L142,252.6 L116,249.5 L90,254.7 L64,248.9 L38,248.8 L12,253.1 L7.1,260 L9.6,234 L2,208 L11.1,182 L7.3,156 L0.3,130 L1.8,104 L6.6,78 L6,52 L2.8,26 Z',
  },
  medium: {
    box: '0 0 180 150',
    d: 'M0,5.1 L22,7.3 L44,6.5 L66,9 L88,5 L110,5.6 L132,5.5 L154,6.9 L176,0.9 L174.3,0 L177.8,22 L171.1,44 L173.9,66 L178.1,88 L175.5,110 L172.5,132 L180,149 L158,143.4 L136,141.4 L114,147.7 L92,147.7 L70,143.8 L48,141.3 L26,147.2 L4,146.6 L6,150 L7.3,128 L7.3,106 L2.6,84 L2.6,62 L4.7,40 L0.6,18 Z',
  },
  small: {
    box: '0 0 130 110',
    d: 'M0,0.2 L18,0.3 L36,1.5 L54,5.4 L72,4.5 L90,3 L108,1.5 L126,6.7 L123.5,0 L124,18 L128.4,36 L123.3,54 L129.4,72 L126.7,90 L123.2,108 L130,102.1 L112,103.8 L94,110 L76,105.7 L58,102.8 L40,109.4 L22,102.1 L4,105 L6.8,110 L1.1,92 L7.7,74 L2.1,56 L0.7,38 L6.9,20 L1.9,2 Z',
  },
} as const

/**
 * A scrap of coloured paper, for the collage behind the words.
 *
 * Decoration only — `aria-hidden`, and positioned by the caller.
 */
export function Scrap({
  size = 'medium',
  fill,
  className = '',
  style,
}: {
  size?: keyof typeof SCRAPS
  fill: string
  className?: string
  style?: CSSProperties
}) {
  const scrap = SCRAPS[size]
  return (
    <svg
      viewBox={scrap.box}
      preserveAspectRatio="none"
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
      style={style}
    >
      <path d={scrap.d} fill={fill} />
    </svg>
  )
}

/**
 * A slot for one of the cut-out photographs.
 *
 * Until a photo is dropped in, it renders as the coloured scrap that sits behind
 * that photo in the collage anyway — so the page is composed rather than full of
 * empty boxes, and adding the image later is one `<img>` inside this.
 */
export function PhotoSlot({
  fill,
  size = 'medium',
  className = '',
  children,
}: {
  fill: string
  size?: keyof typeof SCRAPS
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden>
      <Scrap size={size} fill={fill} className="inset-0 size-full" />
      {children}
    </div>
  )
}

/**
 * The grain that stops the flat colours reading as vector art.
 *
 * Absolute rather than fixed, and painted over the page's own background rather
 * than behind it — the landing page sets its own ground and does not follow the
 * system theme, so there is nothing behind it to show through.
 */
export function PaperGrain() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full opacity-[0.06] mix-blend-multiply">
      <filter id="paper-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-grain)" />
    </svg>
  )
}
