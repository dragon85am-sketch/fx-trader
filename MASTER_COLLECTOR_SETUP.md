# FX TRADE Master Collector

## What changed
- One collector for up to 150 configured instruments.
- One WebSocket connection to Live-Rates.
- Generic SSE: `/api/market/{symbol}/stream` (legacy `/api/{symbol}/stream` also works).
- Generic candle API in Next.js: `/api/market/candles?symbol=XAUUSD&interval=1min&limit=300`.
- DB candle frames: 1min, 5min, 15min, 30min, 1h, 4h, 1day.
- Tick batches preserve open/high/low/close and tick count while reducing DB writes.
- FX Market Scanner uses Master Collector first and falls back to its previous provider while a symbol warms up.
- PRO, Alpha (US30) and Harmonic (US30) use the shared candle endpoint.

## Railway / collector command
Use either:
`npm run market:collector`

The old `npm run us30:collector` alias now starts the same master collector.

## Environment
Required:
- `LIVE_RATES_API_KEY`
- `DATABASE_URL`
- `PORT` (Railway normally supplies this)

Optional:
- `LIVE_RATES_INSTRUMENTS` comma-separated provider symbols. If omitted, the 150-symbol master list is requested.

Next.js / Vercel:
- `NEXT_PUBLIC_US30_LIVE_URL` must point to the deployed collector base URL (kept for backward compatibility; it is now the master feed URL).

## First deployment check
Open collector `/health` and verify:
- `connected: true`
- `configured: 150` (or your env override count)
- `receivedSymbols` increases
- `latestTicks` contains the instruments supported by your Live-Rates plan/provider naming.

Provider support is authoritative: symbols not delivered by Live-Rates will not magically tick. The FX scanner retains its old provider fallback for candle history during migration.
