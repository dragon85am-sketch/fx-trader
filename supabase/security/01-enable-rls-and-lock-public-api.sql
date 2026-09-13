-- FX TRADE — Supabase hardening
-- Date: 2026-09-13
--
-- Architecture verified in this project:
--   * Application tables are accessed server-side through Prisma.
--   * economic_events is accessed server-side with SUPABASE_SERVICE_ROLE_KEY.
--   * The browser does not query these tables directly with supabase.from(...).
--
-- Therefore anon/authenticated do not need direct PostgREST table access.
-- Prisma/database-owner and Supabase service_role continue to work because we do
-- NOT use FORCE ROW LEVEL SECURITY and we do NOT revoke service_role privileges.

BEGIN;

-- App / account tables
ALTER TABLE IF EXISTS public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."AffiliateSale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."AffiliateStat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."PayoutRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."DashboardStat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."ActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."SessionMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."SessionPresence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."AffiliateCampaign" ENABLE ROW LEVEL SECURITY;

-- Server-only economic calendar table (accessed through supabaseAdmin/service_role)
ALTER TABLE IF EXISTS public.economic_events ENABLE ROW LEVEL SECURITY;

-- Prisma metadata should never be exposed through anon/authenticated API roles.
ALTER TABLE IF EXISTS public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- Remove direct table privileges from Supabase public API roles.
-- Existing application traffic is server-side and does not depend on these grants.
REVOKE ALL ON TABLE public."User" FROM anon, authenticated;
REVOKE ALL ON TABLE public."PasswordResetToken" FROM anon, authenticated;
REVOKE ALL ON TABLE public."AffiliateSale" FROM anon, authenticated;
REVOKE ALL ON TABLE public."AffiliateStat" FROM anon, authenticated;
REVOKE ALL ON TABLE public."PayoutRequest" FROM anon, authenticated;
REVOKE ALL ON TABLE public."DashboardStat" FROM anon, authenticated;
REVOKE ALL ON TABLE public."ActivityLog" FROM anon, authenticated;
REVOKE ALL ON TABLE public."SessionMessage" FROM anon, authenticated;
REVOKE ALL ON TABLE public."SessionPresence" FROM anon, authenticated;
REVOKE ALL ON TABLE public."AffiliateCampaign" FROM anon, authenticated;
REVOKE ALL ON TABLE public.economic_events FROM anon, authenticated;
REVOKE ALL ON TABLE public._prisma_migrations FROM anon, authenticated;

COMMIT;
