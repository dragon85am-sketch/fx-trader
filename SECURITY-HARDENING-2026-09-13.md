# FX TRADE — security hardening (2026-09-13)

## Included

- RLS hardening script for all current application tables.
- Direct Supabase `anon` / `authenticated` table privileges removed.
- Verification SQL for RLS, policies, and grants.
- Existing RLS-tested tables retained: `AffiliateCampaign`, `SessionMessage`, `SessionPresence`.
- Public diagnostic/user-list endpoints hardened to admin-only.
- Obsolete public user-creation endpoint disabled; registration continues through `/api/register` (which hashes passwords).
- Economic-event seed endpoint protected by `CRON_SECRET` or an authenticated admin session.

## Tables protected

`User`, `PasswordResetToken`, `AffiliateSale`, `AffiliateStat`, `PayoutRequest`, `DashboardStat`, `ActivityLog`, `SessionMessage`, `SessionPresence`, `AffiliateCampaign`, `economic_events`, `_prisma_migrations`.

## Deployment checklist

1. Deploy this code package to Vercel.
2. If `/api/cron/seed-economic-events` is used by automation, add a strong `CRON_SECRET` environment variable in Vercel. Vercel Cron can send it as `Authorization: Bearer <CRON_SECRET>`.
3. In Supabase SQL Editor run `supabase/security/01-enable-rls-and-lock-public-api.sql`.
4. Test login, registration, password reset, dashboard, affiliate, session chat/presence, payouts/admin, and economic calendar.
5. Run `supabase/security/02-verify-security.sql`.

## Notes

The security design matches the current app architecture: data access is server-side through Prisma or Supabase service-role routes. It intentionally does not use Supabase Auth row ownership policies because Prisma user IDs are CUID strings.
