# FX TRADE — Performance + BOX fix (2026-09-05)

Zmiany:
- usunięty efekt ponownego przeliczania danych wykresu wywoływany przez `overlayTick`, który mógł tworzyć ciągłą pętlę renderów;
- live wskaźniki EMA/BB są odświeżane maksymalnie 4 razy/s zamiast przy każdym ticku;
- canvas rysunków nie jest już kosztownie przeskalowywany przy każdym ruchu myszy;
- zapis rysunków do localStorage jest opóźniony o 250 ms, więc drag nie blokuje UI;
- BOX/RECT jest podświetlany po najechaniu i zaznaczeniu;
- przeciąganie BOX/RECT liczone jest względem pozycji startowej w pikselach, zamiast dodawania różnicy czasu świec, dzięki czemu obiekt nie powinien cofać się ani skakać;
- poprawiono kursor `move/grabbing` dla obiektów;
- poprawiono duplikat `tp2` w Telegram route;
- build pozostaje `prisma generate && next build`.

Uwaga: automatyczny Telegram Scanner Bot 24/7 wymaga osobnego server-side engine + harmonogramu. Nie został dodany do tej paczki, aby nie wysyłać sygnałów z uproszczonej logiki innej niż aktualny FX Scanner.
