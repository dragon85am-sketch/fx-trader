# FX TRADE — Supabase Security Pack

This project uses **custom JWT auth + Prisma** for application data. `User.id` is a Prisma CUID, not a Supabase Auth UUID. For that reason, policies based on `auth.uid() = "userId"` are intentionally **not** added.

The browser does not access the protected application tables directly with `supabase.from(...)`. `economic_events` is accessed only from server API routes with `SUPABASE_SERVICE_ROLE_KEY`.

## Run in Supabase SQL Editor

1. Run `01-enable-rls-and-lock-public-api.sql`.
2. Test the app: login, dashboard, session chat, affiliate campaigns, payouts/admin if available, economic calendar.
3. Run `02-verify-security.sql` and confirm all public tables show `rls_enabled = true` and that `anon`/`authenticated` have no direct table grants on the locked tables.

## Important

Do **not** add `FORCE ROW LEVEL SECURITY` to these tables unless the Prisma database role is redesigned. The server-side Prisma connection is expected to remain able to access the database.

Do **not** expose `SUPABASE_SERVICE_ROLE_KEY` to client code. It must stay server-only.
