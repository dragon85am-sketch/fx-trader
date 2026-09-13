-- FX TRADE — verification only. Safe to run after the hardening script.

-- 1) All public tables and their RLS state.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- 2) Any policies that exist (FX TRADE currently intentionally relies on
--    server-side Prisma/service_role rather than browser-side Supabase policies).
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3) Direct privileges granted to anon/authenticated. Expected: zero rows
--    for the locked tables after 01-enable-rls-and-lock-public-api.sql.
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;
