FX TRADE V4 — BOUNDED DRAIN V3 (2026-11-04)

Zmiany względem V2:
- domyślnie 8 zamiast 4 istniejących niezmiennych paczek na cykl (maksimum nadal 8);
- interwał opróżniania 750 ms zamiast 1500 ms;
- maksymalnie 128 nowych pending rows do zamrożenia na cykl zamiast 32;
- zachowano jeden SQL writer, WAL, state.json, ledger, kolejność FIFO i deduplikację;
- dodano dbRetryRows, dbBacklogRows, dbDrainMs do /health/quick;
- poprawiono sprawdzenie nullable lastDbCheckpointMs.

UWAGA: jeśli Railway ma już ustawione OHLC_DB_DRAIN_MS lub OHLC_RECOVERY_MAX_BATCHES
lub OHLC_RECOVERY_NEW_ROWS, te zmienne NADPISUJĄ wartości domyślne.
Aby włączyć profil V3, ustaw w market-collector:
OHLC_DB_DRAIN_MS=750
OHLC_RECOVERY_MAX_BATCHES=8
OHLC_RECOVERY_NEW_ROWS=128
HISTORY_PAUSED=false
OHLC_DB_PROBE_ONCE=false
OHLC_V4_DUAL_WRITER=false

Wdrożenie: rozpakuj do C:\fx-trader, uruchom npm run build.
NIE uruchamiaj railway up dopóki build nie przejdzie i nie potwierdzisz
aktualnego stanu kolejki. Zmiana deploymentu powoduje restart collectora.
Po wdrożeniu monitoruj dbBacklogRows, failedDbWrites, walBytes, checkpointBytes.
Jeśli błędy SQL rosną, ustaw HISTORY_PAUSED=true i przeanalizuj logi;
nie kasuj WAL/state.json ani wolumenu.

Limit 8 paczek nie gwarantuje wzrostu przepustowości: zależy od rozmiaru
paczek, SQL i kosztu checkpointu. Istniejące paczki nie są scalane ani dzielone.
