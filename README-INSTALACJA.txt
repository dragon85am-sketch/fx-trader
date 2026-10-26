FX TRADE - PAKIET LACZONY (Platform Monitor + Educator + Webinary)

Pakiet zawiera tylko zmienione/nowe pliki, nie caly projekt.
Rozpakuj w katalogu glownym projektu z zachowaniem sciezek.
Zrob kopie zapasowa lub commit przed nadpisaniem.

1. npm install
2. npx prisma generate
3. Przetestuj migracje schematu na bazie testowej (npx prisma migrate dev --name educator_webinars)
4. npm run build
5. Po testach wdroz migracje na produkcji przez npx prisma migrate deploy.

UWAGA: Brak weryfikacji buildu i migracji w tym pakiecie.
Status Platform Monitor to faza 1, nie kompletna wersja PRO+.
Nie przesylaj sekretow ani .env.
