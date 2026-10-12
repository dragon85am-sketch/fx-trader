# FX TRADE — historyczne ceny zamknięcia D1 (Live-Rates)

1. W Supabase SQL Editor uruchom `sql/market_daily_close.sql`.
2. Dodaj do środowiska uruchomieniowego (Railway lub lokalnie) `LIVE_RATES_API_KEY` oraz `DIRECT_URL` albo `DATABASE_URL` (już używane przez projekt). Nie ujawniaj klucza.
3. Opcjonalnie ustaw `D1_BACKFILL_START=2025-10-01`, `D1_BACKFILL_END=2026-10-08`, `D1_BACKFILL_SYMBOLS=EURUSD,GBPUSD,USDJPY`.
4. Uruchom **jednorazowo**, w osobnym zadaniu/terminalu: `npm run d1:backfill`. NIE zastępuj polecenia startowego działającego collectora.
5. W Supabase sprawdź: `SELECT symbol, COUNT(*), MIN(day), MAX(day) FROM public."MarketDailyClose" GROUP BY symbol ORDER BY symbol;`

**Ważne:** API `/historical/series` zwraca dzienne kursy zamknięcia, a nie pełne świece OHLC. Tabela `MarketCandle`, skaner i wykresy pozostają bez zmian. Nie włączaj automatycznego harmonogramu przed sprawdzeniem działania na 1–2 symbolach. Domyślna lista filtruje symbole o formacie 6 liter; obsługę metali, indeksów i kryptowalut trzeba potwierdzić z dostawcą. Skrypt ogranicza tempo zapytań do ok. 1/1.2 s i zatrzymuje się przy HTTP 429/503. Ponowne uruchomienie aktualizuje istniejące rekordy bez duplikatów.
