# nutri

A nutrition diary with nutritionist coaching, built on Next.js and Supabase.

## What it is

Two sides of one relationship:

- A **client** keeps a daily diary — morning weight and mood, every meal with
  portion and preparation, water and drinks, activity and stress, supplements
  taken, evening routine, and how they felt. Plus body measurements every couple
  of weeks, charted over time.
- Their **nutritionist** reads those diaries, writes recommendations, manages the
  client's supplement list, and comments on individual days. Clients reply on the
  day in question, or in a general thread.

The two are linked by an **invite code** the nutritionist owns and the client
enters.

## Stack

| Piece    | Choice                                              |
| -------- | --------------------------------------------------- |
| Framework | Next.js 16 (App Router, TypeScript)                 |
| Styling  | Tailwind CSS v4                                      |
| Backend  | Supabase (Postgres, Auth) via `@supabase/ssr`        |

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase project values
npm run dev
```

The app runs at http://localhost:3000. The landing page reports whether the
Supabase connection is live, so a red dot there means the environment variables
are wrong before you go hunting anywhere else.

## Supabase

Credentials live in `.env.local` and are read through `src/lib/supabase/env.ts`,
which throws at boot if either is missing.

Both values are publishable and safe to expose to the browser — **row level
security is what actually protects the data**, so every table needs RLS enabled
with policies written for it.

Three clients, picked by where the code runs:

- `src/lib/supabase/client.ts` — Client Components.
- `src/lib/supabase/server.ts` — Server Components, Server Actions, Route Handlers.
- `src/lib/supabase/proxy.ts` — session refresh, used by `src/proxy.ts`.

### Schema and migrations

SQL lives in `supabase/migrations/`, applied in filename order. After changing
the schema, regenerate the types:

```bash
npx supabase gen types typescript --project-id gezrztmxyxbtbbasvbix \
  > src/lib/supabase/database.types.ts
```

Access rules are enforced in the database, not the app. A client reaches only
their own rows; a nutritionist reaches only the clients linked to them. The
helper functions the policies call live in a `private` schema so PostgREST does
not publish them as API endpoints.

`supabase/tests/rls.sql` proves those rules hold — it creates two clients and a
coach, tries the obvious attacks, and rolls back. Run it after touching any
policy, trigger, or grant.

### A note on Proxy

Next.js 16 renamed Middleware to Proxy, so the session refresh lives in
`src/proxy.ts` rather than `middleware.ts`. It runs on every non-asset request
and rewrites the auth cookies as tokens rotate. If you replace the response it
returns, copy the cookies across or users will be signed out at random.

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```
