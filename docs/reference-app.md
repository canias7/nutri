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
