FX TRADE — LIVE QUEUE + SQLITE WAL ROTATION STRESS TEST

This package contains only scripts/test-live-rotation.mjs. Copy it into your existing C:\fx-trader\scripts. Do NOT overwrite the other production scripts.

Run:
  cd C:\fx-trader
  node scripts/test-live-rotation.mjs
  node scripts/test-rotation-final.mjs
  npm run build

The test creates a temporary SQLite database and dedicated intake journal in the OS temporary directory; it does not use Railway, Live-Rates or the legacy SQL queue. It simulates 7500 ticks across 125 symbols with serialized concurrent queue and 100+ checkpoints, restarts and verifies no duplicates. It is not an end-to-end real LIVE feed test. DO NOT DEPLOY based on this test alone.
