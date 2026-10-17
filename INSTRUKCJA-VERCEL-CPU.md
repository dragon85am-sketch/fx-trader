# FX TRADE — bezpieczna poprawka middleware

## Zmiana
`middleware.ts`: buforowanie zakodowanego sekretu JWT na poziomie instancji, bez zmiany logiki autoryzacji i tras.

## Wdrożenie
1. Zrób kopię obecnego `middleware.ts`.
2. Podmień tylko `middleware.ts` z tej paczki w katalogu głównym projektu.
3. Wykonaj `npm run build`.
4. Jeśli build przejdzie, wdrożenie na Vercel.
5. Sprawdź logowanie, PIN, rejestrację, dostęp admina i przekierowania.

## Ważne
To mikrooptymalizacja, nie naprawa przyczyny historycznych 5h47m CPU.
Dane z ostatnich 12 godzin nie pozwalają ustalić źródła skoków z września.
Nie modyfikowano layoutu ani strony głównej: ich zmiana bez testów języka i autoryzacji mogłaby spowodować regresje.
Nie gwarantuje oszczędności mierzalnej w panelu Vercel.
