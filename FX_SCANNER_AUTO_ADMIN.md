# FX Scanner AUTO ADMIN 24/7

## What changed
- FX Scanner UI is restricted to the test symbol whitelist in `lib/fx-scanner/symbols.ts`.
- Browser/user sessions no longer send Telegram notifications.
- `scripts/fx-scanner-worker.ts` is the only process that creates/monitors central scanner trades.
- Active and Closed Trades are stored in PostgreSQL (`FxScannerTrade`).
- Users read central Active/Closed trades from `/api/fx-scanner/trades` and see the zones/results.
- Telegram endpoint requires `FX_SCANNER_WORKER_KEY`, so a logged-in user cannot trigger a Telegram alert from the browser.

## Deploy
1. Apply DB migration: `npx prisma migrate deploy`
2. Deploy the Next/Vercel app.
3. On Railway create a second service from the same repo (or use the same project) with Start Command: `npm run fx:scanner`
4. Worker variables: `DATABASE_URL`, `DIRECT_URL`, `FXTRADE_APP_URL`, `FX_SCANNER_WORKER_KEY`.
5. Vercel/app variables: set the SAME `FX_SCANNER_WORKER_KEY`; keep Telegram variables there.
6. Optional worker variable: `FX_SCANNER_INTERVAL_MS=30000`.

The worker scans M1/M5/M15/M30/H1/H4/D1. Symbols without enough `MarketCandle` history are skipped automatically.
