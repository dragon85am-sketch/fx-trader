FX TRADE Scanner PRO — ZBIORCZA PACZKA KANDYDAT 4.1–4.9
Źródło: update-oscilator.zip (14.11.2026)

WAŻNE: paczka NIE była testowana ani wdrożona na serwerze, zgodnie z prośbą użytkownika.
Nie należy traktować wszystkich faz jako potwierdzonych napraw.

ZMIANY WPROWADZONE W TEJ PACZCE:
4.4/4.5: DrawingsLayer otrzymuje surowe OHLC również w Renko (kotwice czasu/ceny),
  zamiast cegieł syntetycznych. W źródle istniała już wspólna pamięć rysunków
  dla timeframe i niewidoczna oś czasu.
4.6: jedna logika BUY/SELL z surowych OHLC na Candles, HA i Renko;
  strefy formacji także z surowych OHLC; etykiety Renko rzutowane na
  najbliższą cegłę. Dokładne pozycjonowanie wymaga sprawdzenia po wdrożeniu.

FUNKCJE JUŻ OBECNE W OTRZYMANYM ŹRÓDLE (nie są nowo naprawione):
4.1: zapis BB w localStorage i odtwarzanie ustawień.
4.2: zależność fiboLevels w rysowaniu, obsługa klawiszy z pominięciem inputów.
4.3: mechanizmy przeciągania rysunków i stref.
4.7: aktualizacja świec LIVE.
4.8: V6 manual price range / 360 PAN (nieprzebudowane).
4.9: dynamiczna skala oscylatorów i symetryczny histogram AO.

STATUS: pełne zachowanie faz 4.1–4.9 NIE JEST ZWERYFIKOWANE.
Paczka zawiera bieżące pliki skanera, nie cały projekt.

PODMIANA: wykonaj kopię aktualnych plików; wypakuj z zachowaniem ścieżek
w katalogu głównym projektu. Nie nadpisuj całego katalogu app.
