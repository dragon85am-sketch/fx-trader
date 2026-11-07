# FX TRADE V4 — etap 4A (bezpieczne przygotowanie)

Ta paczka jest **przyrostową poprawką** do etapu 3, a nie pełnym, niezależnym HISTORY WORKEREM.

## Zmiany
- Tick jest trwale zapisany do WAL **przed** publikacją SSE i aktualizacją latestTicks.
- Przy zaległościach kolejka SQL wznawia pracę szybciej (domyślnie co 1500 ms zamiast 60000 ms), o ile poprzedni zapis się powiódł. Jeden przebieg nadal ma ograniczenie czasu pracy.
- Po błędach DB nadal działa exponential backoff, bez agresywnego bombardowania PostgreSQL.
- Dodane liczniki `drainSchedules`, `dbDrainMs`, `dbDrainBacklogRows` do diagnostyki.
- Bez zmian schematu DB, formatu WAL, ID batchy i zasad ledger.

## Plik do podmiany
`scripts/master-market-collector.ts` — podmień tylko w lokalnym projekcie, w którym etap 3 przeszedł build.

## Opcjonalne zmienne środowiskowe (bez potrzeby ustawiania)
- `OHLC_DB_DRAIN_MS=1500`
- `OHLC_DB_DRAIN_BACKLOG_ROWS=1000`

## Sprawdzenie lokalne
`npm run build`

## Ważne
- **NIE WDRAŻAJ NA RAILWAY** na tym etapie.
- Ta wersja nie izoluje jeszcze SQL LIVE/HISTORY. Jeden wolny SQL nadal blokuje kolejne zapisy.
- Zwiększona częstość prób zapisu może podnieść obciążenie DB — wymaga pomiarów na odizolowanym środowisku.
- Do pełnego etapu 4B potrzebne są osobne wykonawcy SQL, atomowe przejęcie chunków i testy restartów/wyścigów.
