# FX TRADE V4 — bezpieczna kontrola SQL

Najważniejsza poprawka: dotychczasowy plik NIE sprawdzał HISTORY_PAUSED.
Nowy plik respektuje tę flagę i domyślnie blokuje SQL.

1. Podmień scripts/master-market-collector.ts.
2. Lokalnie: cd C:\\fx-trader && npm run build
3. Na tym etapie NIE wdrażaj jeszcze do Railway. Najpierw potwierdź build.

Po późniejszym, osobno uzgodnionym wdrożeniu:
- HISTORY_PAUSED=true: zero zapisów SQL; LIVE i WAL nadal działają.
- HISTORY_PAUSED=false oraz OHLC_DB_PROBE_ONCE=true:
  najwyżej JEDNA próba SQL na proces, tylko chunk do 8 wierszy.
  Większy historyczny chunk jest odrzucany BEZ zmiany jego ID.
- HISTORY_PAUSED=false i OHLC_DB_PROBE_ONCE=false: normalne zapisy (NIE UŻYWAĆ jeszcze).
- OHLC_V4_DUAL_WRITER=true: testowane dopiero później, nie podczas probe.

W /health: historyPaused oraz dbMetrics.dbProbeAttempted/dbProbeSucceeded.
NIE usuwaj state.json, ticks.wal ani Volume. Nie włączaj masowego drainu.
