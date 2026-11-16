# FX TRADE OHLC Priority V4

## Zmiany
- Domyślnie włącza `OHLC_V4_HISTORY_PRIORITY` (można wyłączyć `false`).
- Przenosi ograniczoną liczbę `pending` do trwałych chunków także przy dużym `retryChunks`.
- W pierwszej kolejności zamraża aktualne buckety, a `chooseNextChunk()` wybiera je wyłącznie wtedy, gdy nie wyprzedzają wcześniejszego zapisu tego samego klucza.
- Nie zmienia SQL, WAL, formatu checkpointów, bucketów ani identyfikatorów istniejących chunków.
- Nie uruchamia `OHLC_V4_DUAL_WRITER`.

## Wdrożenie
Podmień oba pliki w repozytorium:
- `scripts/master-market-collector.ts`
- `lib/market/history-priority.ts`

```powershell
git add scripts/master-market-collector.ts lib/market/history-priority.ts
git commit -m "fix: prioritize live OHLC without starving pending V4"
git push origin main
```

## Kontrola po wdrożeniu
W `/health` sprawdź `dbMetrics.v4HistoryPriority`, `priorityLiveWrites`, `historyWrites`, `dbRetryRows`, `dbPendingRows`, `lastDbSuccessAt`, `failedDbWrites`, `ingestionDiagnostics`.
W Supabase sprawdź `max(bucket)` i `max(updatedAt)` dla M1/M5; powinny być blisko aktualnego czasu sesyjnego.
Jeśli `bucket` nadal jest opóźniony mimo malejącego backlogu, osobno zbadaj timestamp dostawcy.

**Ograniczenia:** nie jest to historyczny backfill; nie gwarantuje naprawy źródłowych opóźnionych timestampów. Przed wdrożeniem zalecany pełny `tsc`/build w repozytorium. Przy bardzo dużym backlogu checkpoint może trwać dłużej. Nie usuwaj wolumenu `/data` ani WAL.
