# FX TRADE — pakiet po aktualizacji

## Zrobione
- FX Scanner: usunięty przycisk TOOLS i widoczny opis algorytmu; FORMACJE zachowane.
- MarketChart: BOX/RECT można wybierać w trybie SELECT.
- PRO FX Scanner: pełny ekran wykresu + ESC.
- GOLD Scalping: zachowana tabela sygnałów, polskie etykiety i nacisk na M1/M5.
- Economic Calendar: oficjalne daty CPI/NFP 2026; 2027 bez wymyślonych terminów do czasu publikacji BLS.
- Sesje LIVE: player konfigurowany przez NEXT_PUBLIC_SESSION_LIVE_URL, link kanału przez NEXT_PUBLIC_SESSION_CHANNEL_URL.
- Pokój rozmów LIVE: wspólne wiadomości Premium przez Prisma/API.
- Affiliate Hub: Dashboard + Kampanie + Prowizje + Wypłaty + Materiały; brakujące route'y dodane.
- Strategie: ujednolicone ramki/proporcje grafik i poprawki polskich znaków.
- Sidebar: polskie nazwy nowych sekcji.
- Sprawdzono, że wszystkie statyczne obrazy używane przez strony strategii istnieją.

## Po wdrożeniu
1. Uruchom migracje Prisma: npx prisma migrate deploy
2. W Vercel ustaw opcjonalnie NEXT_PUBLIC_SESSION_LIVE_URL i NEXT_PUBLIC_SESSION_CHANNEL_URL.
3. Zachowaj istniejące sekrety Stripe/Supabase/DB wyłącznie w Vercel — nie są dołączone do ZIP.

## Walidacja
Pełny npm ci w środowisku roboczym dwukrotnie przekroczył limit czasu, dlatego build nie jest oznaczony jako zweryfikowany. Nie był to błąd kompilacji aplikacji — instalacja zależności nie zakończyła się w dostępnym czasie.
