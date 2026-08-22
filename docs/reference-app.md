# NutriTrack — reverse-engineered feature map

Source: https://nutritrack-2.ai.studio/ (Vite + React SPA, Firebase Auth + Firestore,
Redux Toolkit, recharts, html2canvas). Bilingual RU/EN, **defaults to Russian**.
PWA, portrait, mobile-first, emerald theme (#10b981).

## Roles
- **client** — logs the diary
- **nutritionist** — reviews clients, writes recommendations, comments on days
- **admin** — "Master Admin Dashboard" exists

Linked by **invite code**: nutritionist owns a unique code (e.g. `ivanova_coach`),
client enters it at signup or later in profile. `demo` is a demo code.

## Firestore structure (original)
- `users/{uid}` → { uid, role, name, email, language, nutritionistId }
- `clients/{uid}` → profile, goal, biometrics, initialComplaints, recommendations, lastLoggedDate
- `clients/{uid}/dailyLogs/{YYYY-MM-DD}` → the diary doc
- `clients/{uid}/supplements/{id}`
- `clients/{uid}/measurements/...`
- `messages`, `comments`

### dailyLogs document shape
```
morning:     { wakeTime, mood, weight, activity, energy, firstWarmDrink }
meals:       { breakfast|secondBreakfast|lunch|dinner: {eaten, amount, method, time}, waterTotal }
drinks:      [ ... ]           // waterTotal is derived from this
stool:       [ ... ]
daytime:     { activityType, duration, stressLevel, stressRelief, outdoorTime }
supplements: { taken: [...], custom }
evening:     { ritual, gadgetOffTime, bedTime }
complaints:  { emotionalState, skin, digestion, other }
updatedAt
```
Default meal times: breakfast 08:30, 2nd breakfast 11:00, lunch 13:00, dinner 19:00.

Section order:
`["morning","breakfast","water","stool","lunch","daytime","supplements","dinner","evening","complaints"]`

## Client onboarding
Name, email, password, role → invite code (optional) → biometrics (age, height,
starting weight, gender) → main goal + target deadline → baseline complaints
questionnaire (emotional/sleep, digestion/GI, skin/hair/nails, other).

## Daily diary — 6 steps
1. **Morning** — wake time, waking mood, morning weight, morning activity, energy level
2. **Diet & Water** — first morning warm drink; breakfast / 2nd breakfast / lunch /
   dinner, each with what you ate + portion + preparation method + time; drinks list
   with type and volume; hydration progress vs recommended ml
3. **Day Activity & Stress** — activity type, duration, stress level (/10),
   stress relief method, outdoor time
4. **Supplements** — checkboxes off the client's regular list (morning/daytime/evening)
   + one-off/other supplements
5. **Evening** — evening routine, gadgets-off time, bed time
6. **Complaints** — emotional state, skin, digestion/GI, other symptoms

Plus **bowel movement / stool records** per day (time + description).

Autosaves as you type. Can edit past days ("log for another date").

## Body measurements
Every 2 weeks, morning, empty stomach. **Interactive body map** — click a point to
focus that input. Fields: waist, hips, rib cage, upper arm L/R, thighs L/R,
above knee L/R. cm/inch and kg/lb+oz conversion. History + change graphs.
Nudge: "more than 2 weeks since your last entry".

## Dashboard & analytics
Daily logging progress (completed sections), streak in days, weight dynamics chart
(14 days), water balance + weekly average, **Stress vs Energy correlation**,
measurement dynamics vs previous, log history (14 days).

## Coaching loop
- Nutritionist dashboard: client list, search by name/age/gender, select client
- View client biometrics, goal, diary history, metrics, detailed log
- **Prescriptions / recommendations** written per client
- **Per-day discussion threads** on a specific diary day, both directions, unread badges
- **General chat** not tied to a day ("Messages & Consultations")
- Manage the client's regular supplement list

## Extras
- PWA install flow (iOS / Android / desktop instructions)
- **Day summary poster** — render day as PNG, download or share
- Account deletion (type your name to confirm)
- Demo login / quick role switch
- Offline caching, draft autosave

## Where nutri deliberately departs

This file describes the reference app. These are the places our version does
something else on purpose, so the difference does not keep getting read as a gap.

**Who can sign up**

- **Clients only.** Public sign-up creates clients; nutritionist accounts are
  provisioned against the database. Anyone able to register themselves as a
  specialist could start collecting clients.
- **No demo login.** One click into somebody's health diary is a liability, not
  a feature.
- **English only.** The reference defaults to Russian with English available.

**The diary**

- **One food list, not five named meals.** The reference gives breakfast, second
  breakfast, lunch, snack and dinner a box each. On most days that is four empty
  boxes, and there is nowhere to put a sixth meal. Ours is a single section with
  an entry per thing eaten, added as the day goes — each with an optional photo,
  which carries a portion better than "≈250 g" does.
- **A week strip, not a heading with arrows.** The day picker shows the seven
  days of the week being read; arrows still step one day and carry into the week
  either side. There is no "log for another date" jump and no step counter — a
  diary that scores you out of six invites filling boxes rather than answering
  them.
- **Required answers are named, never enforced.** Wake-up time, morning weight,
  energy level, a drink, what you ate and when, and asleep-at carry a marker, and
  their section says "Needs an answer" until it has one. Nothing is blocked: a
  half-filled day still saves, which is the whole point of autosaving. The rest
  say "Optional" outright rather than leaving the reader to guess.
- **Every drink counts toward the water target.** The reference counts clean
  water only, and asks per drink. A total that disagrees with the list above it
  is worth less than the distinction it was drawing.
- **No stool records and no day poster.** Both dropped at the owner's request;
  digestion is still asked about in "How you felt". `log_stools` is left in the
  schema rather than dropped, so the days already logged are not thrown away.

**Navigation and layout**

- **Weight is charted against the starting weight**, not as a level. A line
  drifting between 70 and 71 says less than a bar three kilos under where it
  began.
- **Body measurements live on the profile**, with the other standing facts —
  height, starting weight, goal — rather than in the daily nav. Weight is not
  asked for there: the diary takes one every morning.
- **No History tab and no Recent days panel.** The week strip covers the days
  people actually fill in; `/history` still answers at its URL.
- **Messages is a chat**, not a list with a form under it: newest at the bottom,
  a composer that does not scroll away, runs grouped, and a sent message on
  screen before the server has it.

**Units**

- **Imperial weight is pounds and ounces**, never decimal pounds — no scale has
  ever shown 155.2 lb. Everything is stored in kg and cm; the toggle only changes
  entry and display, and it applies to every readout, not just the inputs.

Still missing, and known: offline writes (the service worker caches reads only),
resend-confirmation, an OG image, and Russian localisation.
