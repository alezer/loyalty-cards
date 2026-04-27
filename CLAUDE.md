# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Run everything (frontend + backend in parallel):**
```bash
npm run dev
```

**Individual workspaces:**
```bash
npm run dev:frontend    # Next.js on :3000
npm run dev:backend     # Hono on :4000
```

**Type-checking both workspaces at once:**
```bash
npm run type-check
```

**Within a workspace (from its folder):**
```bash
npm run lint            # ESLint (frontend only)
npm run build           # Next.js build / tsc compile
```

There are no automated tests yet.

## Architecture

**Monorepo with npm workspaces:** `frontend/` (Next.js 15 App Router) + `backend/` (Hono/Node.js) + `supabase/` (SQL migrations only).

### Request flow

```
Browser
  → Next.js frontend (port 3000)
  → /api/v1/* rewrites (next.config.ts) → Hono backend (port 4000)
  → Supabase PostgreSQL
```

For simple reads, the frontend queries Supabase directly (no backend hop). The backend is used when elevated logic or service-role access is needed.

### Two Supabase clients (backend)

`backend/src/lib/supabase.ts` exports two clients with different purposes:

- **`supabaseAdmin`** — service role key, bypasses RLS. Used only for JWT validation (`auth.getUser(token)`) and privileged admin operations.
- **`createUserClient(token)`** — anon key + user's JWT in the Authorization header. Passes the user's identity into PostgreSQL so `auth.uid()` works and RLS policies apply. Always use this when calling RPCs that rely on `auth.uid()`.

### Frontend Supabase clients

- `lib/supabase/client.ts` — browser client (`createBrowserClient`). Use in `'use client'` components.
- `lib/supabase/server.ts` — server client (`createServerClient`) with cookie-based session. Use in Server Components, Server Actions, and Route Handlers.
- `middleware.ts` — refreshes the Supabase session on every request; required for SSR auth to stay alive.

### Database-level business logic

**All stamp logic lives in PostgreSQL, not in application code.** The entry point is the `add_stamp(p_customer_id, p_business_id)` RPC. Calling it triggers a chain:

1. RPC validates the caller's role and business membership via `auth.uid()`
2. Creates the `loyalty_cards` row if it doesn't exist (`ON CONFLICT DO NOTHING`)
3. Inserts into `stamps_log` → fires the `trg_on_stamp_insert` trigger
4. Trigger (`fn_process_stamp_insert`, BEFORE INSERT):
   - Aborts with `ERRCODE P0001` if the same card was stamped < 60 seconds ago ("Escaneo duplicado detectado")
   - Increments `loyalty_cards.stamps_count`
   - Inserts a `rewards` row if `stamps_count % stamps_goal = 0`
5. RPC returns `{ success, card_id, stamps_count, stamps_goal, reward_available }`

Other triggers: `fn_handle_new_user` (auto-creates `profiles` on auth signup for both email and OAuth), `fn_handle_reward_redeem` (auto-fills `redeemed_at` + `staff_id_redeemer` on UPDATE), `fn_update_updated_at` (maintains `updated_at` on all mutable tables).

### Roles and RLS

Four roles defined as a PostgreSQL enum: `admin`, `owner`, `staff`, `customer`. Every table has RLS enabled. Three helper SQL functions drive all policies: `get_my_role()`, `get_my_business_id()`, `is_admin()` — all `SECURITY DEFINER` to avoid recursion on `profiles`.

Key constraint: staff can only INSERT into `stamps_log` for cards belonging to their own `business_id`. This is enforced both in the `add_stamp` RPC and in the RLS policy as defense-in-depth.

### Backend auth middleware

`backend/src/middleware/auth.ts` runs on every route:
1. Validates `Authorization: Bearer <token>` header
2. Calls `supabaseAdmin.auth.getUser(token)` to verify the JWT
3. Fetches `role` and `business_id` from `profiles`
4. Sets `userId`, `userRole`, `businessId`, `userToken` on the Hono context

Routes consume these via `c.get('userId')` etc.

### Adding a new backend route

1. Create `backend/src/routes/<name>.ts`, export a `new Hono()` router
2. Apply `authMiddleware` with `router.use('*', authMiddleware)`
3. Use `createUserClient(c.get('userToken'))` for user-context DB calls
4. Register in `backend/src/routes/index.ts`

### Adding a new frontend page

Pages go under `frontend/app/`. Use `lib/supabase/server.ts` in Server Components and `lib/supabase/client.ts` in Client Components. New database types go in `lib/types/database.ts`.

## Environment variables

**Frontend** (`.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL` (default: `http://localhost:4000`)

**Backend** (`.env`):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` (default: `4000`)
- `FRONTEND_URL` (CORS origin, default: `http://localhost:3000`)

## Database changes

All schema lives in `supabase/migrations/001_initial_schema.sql`. Run new SQL directly in the Supabase Dashboard → SQL Editor. To promote a user to admin after first sign-up:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'email@example.com';
```
