# FX TRADE V4 — ETAP 4D (PostgreSQL)

To testuje **rzeczywisty SQL wyodrębniony z kolektora 4B**, ale wyłącznie na osobnej, jednorazowej bazie PostgreSQL.

**NIE URUCHAMIAJ na bazie produkcyjnej.** Test tworzy i czyści tabele `MarketCandle` i `MarketCandleBatchLedger` w bazie testowej.

Wymagania: oddzielna baza PostgreSQL o nazwie `fxtrade_4d_test` (lub `fxtrade_4d_test_nazwa`), dostęp z komputera, zależności projektu z `@prisma/client`.

Skopiuj `verify-stage4d-postgres.cjs` do `C:\fx-trader\stage4d\`.

PowerShell:

```powershell
cd C:\fx-trader
$env:FXTRADE_4D_TEST_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/fxtrade_4d_test?sslmode=require"
$env:FXTRADE_4D_ALLOW_TEST_DB="YES"
node .\stage4d\verify-stage4d-postgres.cjs .\scripts\master-market-collector.ts
```

Nie wklejaj tutaj hasła ani URL bazy. Prześlij tylko wynik PASS/FAIL.

Skrypt odmawia połączenia, jeśli nazwa bazy nie pasuje do `fxtrade_4d_test...`. Wykonuje pięć testów SQL. Nie uruchamia kolektora, nie łączy się z Live-Rates, nie dotyka Railway Volume i nie testuje fizycznego restartu/WAL. Te testy będą osobnym krokiem.
