-- Ensure user preference/profile columns used by /api/me exist in production.
-- Idempotent to support databases where some columns were added manually.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "theme" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "language" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "priceFormat" TEXT DEFAULT 'dot';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
