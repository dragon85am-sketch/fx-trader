# FX TRADE D1 Backfill V2

Replace `scripts/live-rates-daily-close-backfill.ts` with the provided TypeScript file.

## Local test (PowerShell)

```powershell
$env:D1_BACKFILL_SYMBOLS="EURUSD,GBPUSD,USDJPY,USDCHF,AUDUSD,USDCAD,NZDUSD"
$env:D1_BACKFILL_START="2026-10-01"
$env:D1_BACKFILL_END="2026-10-07"
npm run d1:backfill
```

Requires `LIVE_RATES_API_KEY`, `DIRECT_URL` (or `D1_BACKFILL_DATABASE_URL`), and `certs/prod-ca-2021.crt`.

## Railway daily scheduled job

Use a **separate Railway cron service** based on the same repo, not the existing market collector service. Start command: `npm run d1:backfill`. Schedule: `15 1 * * *` (01:15 UTC every day). Configure environment variables `LIVE_RATES_API_KEY`, `D1_BACKFILL_DATABASE_URL` (valid Supabase pooler URL), and `D1_BACKFILL_SYMBOLS` if overriding the verified default set.

The certificate is needed at runtime. Prefer storing the PEM as a Railway secret and writing it to a file during startup, or including the public CA certificate as a separately tracked non-secret file after verifying its provenance. Do not commit database URLs or API keys.

With no `D1_BACKFILL_START`/`D1_BACKFILL_END`, the job rechecks the previous seven UTC days, ending yesterday. `ON CONFLICT` makes repeated runs idempotent. The job returns non-zero on incomplete windows or errors, so Railway logs surface issues.

**This is daily close data only, not OHLC.**
