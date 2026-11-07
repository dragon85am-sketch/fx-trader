# FX TRADE V4 — ETAP 3: HISTORY PRIORITY (wersja testowa)

## Co zmienia
- Zachowuje jeden trwały WAL, snapshot i jednego writera PostgreSQL.
- Kolejka SQL może dawać pierwszeństwo nowszym świecom, ale tylko jeśli nie wyprzedzi starszego zapisu do tego samego symbolu/interwału/bucket.
- Zapewnia sprawiedliwość: po udanych zapisach historycznych może wybrać nowszy pakiet, a po priorytetowym zapisie wraca do historii.
- Nie zmienia identyfikatorów batch, ledger, schematu bazy, ani formatu snapshot/WAL.
- Funkcja jest DOMYŚLNIE WYŁĄCZONA: OHLC_V4_HISTORY_PRIORITY=false.

## Pliki do projektu
scripts/master-market-collector.ts
lib/market/live-candle-engine.ts
lib/market/history-priority.ts
app/api/market/candles/route.ts
scripts/test-live-candle-engine.ts
scripts/test-history-priority.mjs

## Zmienne środowiskowe
OHLC_V4_HISTORY_PRIORITY=true (dopiero po kopii bezpieczeństwa i testach staging)
OHLC_V4_RECENT_WINDOW_MS=300000
OHLC_V4_HISTORY_QUOTA=3

## Test lokalny
node --experimental-strip-types scripts/test-history-priority.mjs
npm run build

## Ograniczenia
To etap przejściowy, nie osobny proces historyczny. Baza może nadal blokować pojedyncze zapytania SQL i LIVE API nadal wymaga połączenia z kolektorem. Nie rozwiązuje automatycznie istniejącego długu ani nie gwarantuje spadku kolejki. Test nie zastępuje pełnego buildu, testu WAL recovery, testów współbieżności, obciążenia i wdrożenia staging. Nie wdrażać wprost na Railway bez spójnego backupu i planu rollbacku.
