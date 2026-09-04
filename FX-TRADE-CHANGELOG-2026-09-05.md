# FX TRADE — poprawki 2026-09-05

## Wykonane
- Usunięto integrację OANDA: trasy API, klient/resolver i nieużywany hook pricing SSE.
- Rozbudowano Edukacja > Setupy z 3 do 9 setupów.
- Dodano setupy: Liquidity Sweep, Bollinger + Price Action, Trend Continuation, Gold Price Action, EMA Pullback, Breakout Momentum.
- Każdy setup ma stronę szczegółową z zasadami BUY/SELL, RR oraz sekcją screenów i przykładów.
- Galeria przykładów używa bezpośrednich plików z /public/education/przyklady, aby uniknąć problemów z brakującymi obrazami po deployu.
- Journal nie seeduje już przykładowych transakcji. Nowy użytkownik otrzymuje pusty journal.
- Journal i Trading Plan są zapisywane w localStorage osobno dla każdego userId.
- Academy: progress, completedLessons, passedQuizzes, aktywna lekcja/moduł, streak i certyfikat są zapisywane osobno dla każdego userId.
- Login i rejestracja ustawiają identyfikator namespace storage; aktywna sesja synchronizuje go przez /api/me.

## Ważne
Pełny `next build` wymaga instalacji zależności (`npm ci`). W środowisku audytu node_modules nie były dostępne, więc wykonano kontrolę źródeł i TypeScript parser zgłasza głównie brak modułów zależności.
