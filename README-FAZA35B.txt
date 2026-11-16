FX TRADE — FAZA 3.5B / KANDYDAT DO TESTÓW LOKALNYCH

PLIKI:
  prisma/schema.prisma
  scripts/fx-scanner-worker.ts
  app/api/telegram/notify/route.ts

UWAGA: NIE WDRAŻAJ TEGO PAKIETU BEZ TESTÓW. ZMIANA PROTOKOŁU
WORKER/ENDPOINT WYMAGA KOORDYNOWANEGO WDROŻENIA.

Projekt rozwiązania:
- Worker wysyła deliveryKey SIGNAL:<tradeId> albo CLOSED:<tradeId>.
- Endpoint rezerwuje unikalny klucz w PostgreSQL PRZED wysłaniem do Telegrama.
- Kolejna próba z tym kluczem otrzymuje 409, nie wysyła drugi raz.
- CLAIMED po awarii / UNCERTAIN po błędzie wymaga ręcznego ustalenia,
  czy Telegram przyjął wiadomość. Automatyczny retry jest blokowany.
- To preferuje BRAK DUPLIKATÓW kosztem ryzyka NIEDOSTARCZENIA.
- WEEKLY pozostaje bez tego mechanizmu i wymaga osobnego rozwiązania.
- Nadal istnieje niepewność dostarczenia przy utracie odpowiedzi Telegrama.

LOKALNE TESTY PRZED WDROŻENIEM:
1. Zrób kopię obecnych trzech plików.
2. Na bazie LOKALNEJ (NIE produkcyjnej) wykonaj migrację schematu Prisma.
3. Uruchom npx prisma generate oraz npx tsc --noEmit.
4. Uruchom lokalny endpoint z atrapą Telegram API, bez prawdziwego tokenu.
5. Sprawdź: pierwszy SIGNAL 200, drugi identyczny 409; równoległe
   żądania: dokładnie jedno zajęcie klucza; błąd sieci: stan UNCERTAIN.
6. Zweryfikuj logikę CLOSED i restart; przejrzyj scenariusz WEEKLY.

PRODUKCJA: najpierw migracja DB, następnie zgodna wersja endpointu
oraz workera w kontrolowanym oknie. Stary worker nie przekazuje
klucza i otrzyma 400 po wdrożeniu tego endpointu. Nie podmieniaj
jednego pliku samodzielnie na produkcji.

Znane ograniczenie: endpoint nie utrwala Telegram message_id; nie
należy nazywać tego exactly-once delivery. Komunikaty TP3 pozostają
bez zmian w tym pakiecie, by nie mieszać dwóch zmian naraz.
