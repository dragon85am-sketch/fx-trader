# FX TRADE — etap 2L: test rzeczywistego workera

Skopiuj wyłącznie `scripts/test-real-worker-2l.mjs` do `C:\fx-trader\scripts\`.
W folderze muszą już być pliki `history-bridge.mjs`, `history-worker.mjs`, `history-sqlite.mjs` z etapu 2J.

Uruchom:

```powershell
cd C:\fx-trader
node scripts/test-real-worker-2l.mjs
```

Test tworzy wyłącznie tymczasową bazę w katalogu systemowym, a nie na Railway. Nie podmieniaj Collectora i nie wykonuj git push. Nie jest to integracja produkcyjna ani pełny test WAL. Przed etapem wdrożenia należy połączyć rzeczywisty Collector z trwałym dziennikiem, checkpointami, blokadą procesu i ograniczeniem przeciążenia.
