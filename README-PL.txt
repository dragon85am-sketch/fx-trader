FX TRADE - SHADOW SQLITE HISTORY / ONE LIVE-RATES CONNECTION

To jest nowa, OSOBNA usluga Railway, NIE zamiennik master-market-collector.

1. Wgraj scripts/history-mirror.mjs do repozytorium, zachowujac istniejace cztery moduly:
   history-bridge.mjs, history-worker.mjs, history-sqlite.mjs, history-intake.mjs.
2. Stworz nowa usluge Railway z tego samego repo, ale z OSOBNYM Volume montowanym /data.
   NIE montuj tego samego Volume co market-collector.
3. Start command: node scripts/history-mirror.mjs
4. Variables:
   COLLECTOR_UPSTREAM_URL=https://market-collector-production-4d3d.up.railway.app
   OHLC_HISTORY_SQLITE_PATH=/data/ohlc-history/history.sqlite
   OHLC_HISTORY_INTAKE_DIR=/data/ohlc-history/intake
5. Healthcheck: /health/quick
6. Nie ustawiaj LIVE_RATES_API_KEY w tej usludze.
7. Stary market-collector i oczekujace zmiany jego SQLite pozostaw bez zmian.

OGRANICZENIA: SSE nie ma numerow zdarzen ani replay. Przy zerwaniu polaczenia
mozliwe sa luki w historii, a restart moze powtorzyc ostatni tick. Samo shadow
nie daje jeszcze gwarancji zero-loss i nie przelacza FX Scannera.
Wersja do uruchomienia rownolegle i monitoringu, nie do podmiany produkcji.
