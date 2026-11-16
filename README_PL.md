# FX TRADE OHLC Recovery V5 — kontrolowany backlog

## Przyczyna
V4 przenosiło do `retryChunks` do 512 wierszy na cykl, a pojedynczy cykl zapisywał maksymalnie 8 istniejących paczek. Gdy stare paczki mają 8 wierszy, liczba retryChunks może gwałtownie rosnąć.

## Zmiana V5
- Gdy `retryChunks.length > OHLC_RECOVERY_RETRY_THRESHOLD` (domyślnie 1000), przenosi do trwałych paczek maksymalnie `min(16, floor(wiersze_zapisane_w_poprzednim_cyklu * 0.5))` nowych wierszy.
- Po nieudanym cyklu SQL nie zamraża nowych wierszy, dopóki zapis zaległych paczek znów nie zadziała.
- Aktualne buckety nadal mają pierwszeństwo w ograniczonej puli nowych paczek, ale nie wyprzedzają starszych paczek tego samego klucza.
- Nie zmienia istniejących chunków, ledger ID, WAL, checkpointów, SQL ani timestampów.
- Domyślnie nadal tylko jeden writer (`OHLC_V4_DUAL_WRITER=false`).

## Wdrożenie
Podmień `scripts/master-market-collector.ts` i `lib/market/history-priority.ts` z archiwum w repozytorium, następnie:

```powershell
git add scripts/master-market-collector.ts lib/market/history-priority.ts
git commit -m "fix: cap OHLC queue inflow to SQL drain throughput V5"
git push origin main
```

**Nie usuwaj `/data/ohlc-fresh-20261106`, `state.json` ani `ticks.wal`. Nie włączaj dual writera.**

## Opcjonalne zmienne
- `OHLC_V5_BACKLOG_FREEZE_CAP=16` (zakres 1–64)
- `OHLC_V5_FREEZE_SHARE=0.5` (zakres 0.1–0.75)
- Istniejące `OHLC_RECOVERY_MAX_BATCHES=8`, `OHLC_DB_DRAIN_MS=750`, `OHLC_V4_HISTORY_PRIORITY=true` pozostają bez zmian.

## Monitoring
Sprawdź `/health` → `dbMetrics` (`version`, `v5LastFrozenRows`, `v5LastCommittedRows`, `v5TotalFrozenRows`, `v5TotalCommittedRows`, `v5BacklogLimitedFlushes`), a także `dbRetryRows`, `dbPendingRows`, `failedDbWrites` i `durableQueue.checkpointBytes`.
W dwóch pomiarach odległych o 10–15 minut `dbRetryRows` powinno maleć, o ile SQL zapisuje szybciej niż powstają nowe dane. Sprawdź też aktualność M1/M5 i luki w Supabase.

## Ograniczenia
To ogranicza wzrost liczby trwałych paczek, ale **nie przyspiesza samej bazy SQL** i nie wypełnia brakujących historycznych ticków. Podczas przeciążenia bieżące świece mogą mieć opóźnienie. Wdrożenie wymaga kompilacji/testów integracyjnych w pełnym repozytorium.
