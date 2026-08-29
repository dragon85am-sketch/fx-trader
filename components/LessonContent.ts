// components/LessonContent.ts

export type LessonContentBlock =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "checklist"; items: Array<{ text: string; checked?: boolean }> }
  | { type: "cta"; text: string }
  | {
      type: "video";
      provider: "youtube" | "vimeo";
      id: string;
      title?: string;
    };

export type LessonContent = {
  blocks: LessonContentBlock[];
};

export const LESSON_CONTENT: Record<string, LessonContent> = {
  // =========================
  // MODUŁ 0 — PODSTAWY TRADINGU
  // =========================
  "m0-l1-czym-jest-trading": {
    blocks: [
      { type: "h2", text: "Czym jest trading?" },
      {
        type: "p",
        text: "Trading to proces podejmowania decyzji kupna lub sprzedaży instrumentów finansowych na podstawie analizy rynku i własnego planu działania.",
      },
      {
        type: "bullets",
        items: [
          "Trader nie zgaduje — trader szuka przewagi.",
          "Każda pozycja powinna mieć logiczny powód wejścia.",
          "Trading to proces decyzyjny, a nie losowe klikanie buy/sell.",
        ],
      },
      {
        type: "quote",
        text: "Trading to nie hazard. Trading to egzekucja przewagi.",
      },
      { type: "h2", text: "Na czym polega praca tradera?" },
      {
        type: "bullets",
        items: [
          "Analizuje rynek i szuka setupów.",
          "Wchodzi tylko wtedy, gdy warunki są zgodne z planem.",
          "Kontroluje ryzyko i emocje.",
          "Powtarza proces setki razy, zamiast oceniać się po jednym trade.",
        ],
      },
      {
        type: "checklist",
        items: [
          { text: "Rozumiem, że jeden trade nic nie znaczy." },
          { text: "Rozumiem, że potrzebuję planu." },
          { text: "Rozumiem, że ryzyko jest częścią gry." },
        ],
      },
      {
        type: "cta",
        text: "Napisz własnymi słowami: czym trading różni się od hazardu?",
      },
    ],
  },

  "m0-l2-jak-dziala-rynek-forex": {
    blocks: [
      { type: "h2", text: "Jak działa rynek Forex?" },
      {
        type: "p",
        text: "Forex to rynek wymiany walut. Gdy handlujesz parą walutową, spekulujesz, czy jedna waluta będzie zyskiwać lub tracić względem drugiej.",
      },
      {
        type: "bullets",
        items: [
          "EUR/USD oznacza relację euro do dolara.",
          "Kupno oznacza, że liczysz na wzrost instrumentu.",
          "Sprzedaż oznacza, że liczysz na spadek instrumentu.",
        ],
      },
      {
        type: "quote",
        text: "Na rynku zawsze handlujesz relacją jednej wartości do drugiej.",
      },
      { type: "h2", text: "Co porusza rynek?" },
      {
        type: "bullets",
        items: [
          "Popyt i podaż.",
          "Dane makroekonomiczne i newsy.",
          "Płynność i aktywność dużych uczestników rynku.",
          "Reakcje ceny na poziomy techniczne.",
        ],
      },
      {
        type: "checklist",
        items: [
          { text: "Rozumiem, czym jest para walutowa." },
          { text: "Wiem, że buy i sell oznaczają kierunek spekulacji." },
          { text: "Wiem, że rynek porusza się przez popyt, podaż i płynność." },
        ],
      },
      {
        type: "cta",
        text: "Otwórz wykres EUR/USD i opisz, co oznacza wzrost ceny tej pary.",
      },
    ],
  },

  "m0-l3-pips-lot-spread": {
    blocks: [
      { type: "h2", text: "Pips, lot, spread — podstawowe pojęcia" },
      {
        type: "p",
        text: "Zanim zaczniesz handlować, musisz rozumieć język rynku. Pips, lot i spread to absolutna podstawa.",
      },
      {
        type: "bullets",
        items: [
          "Pips — podstawowa jednostka ruchu ceny.",
          "Lot — wielkość pozycji.",
          "Spread — różnica między ceną kupna i sprzedaży.",
        ],
      },
      { type: "h2", text: "Dlaczego to ważne?" },
      {
        type: "bullets",
        items: [
          "Bez tego nie policzysz ryzyka.",
          "Bez tego nie zrozumiesz wielkości pozycji.",
          "Bez tego nie będziesz wiedział, ile realnie kosztuje wejście w trade.",
        ],
      },
      { type: "quote", text: "Trader bez liczb jest ślepy." },
      {
        type: "checklist",
        items: [
          { text: "Wiem, czym jest pips." },
          { text: "Wiem, czym jest lot." },
          { text: "Wiem, czym jest spread." },
        ],
      },
      {
        type: "cta",
        text: "Zapisz na kartce definicję pipsa, lota i spreadu własnymi słowami.",
      },
    ],
  },

  "m0-l4-rodzaje-rynkow": {
    blocks: [
      { type: "h2", text: "Rodzaje rynków" },
      {
        type: "p",
        text: "Trader może działać na różnych instrumentach: Forex, indeksy, surowce, krypto. Każdy rynek ma własną charakterystykę.",
      },
      {
        type: "bullets",
        items: [
          "Forex — pary walutowe.",
          "Indeksy — np. US100, DAX, SPX.",
          "Krypto — np. BTC, ETH.",
          "Surowce — np. złoto, ropa.",
        ],
      },
      {
        type: "quote",
        text: "Nie każdy rynek porusza się tak samo. Musisz znać jego charakter.",
      },
      {
        type: "cta",
        text: "Wybierz 3 rynki i opisz, czym się różnią pod względem zmienności.",
      },
    ],
  },

  "m0-l5-jak-dziala-broker": {
    blocks: [
      { type: "h2", text: "Jak działa broker?" },
      {
        type: "p",
        text: "Broker to pośrednik, który umożliwia Ci składanie zleceń na rynku. To przez jego platformę otwierasz i zamykasz pozycje.",
      },
      {
        type: "bullets",
        items: [
          "Broker dostarcza platformę i dostęp do instrumentów.",
          "Broker nalicza koszty, np. spread lub prowizję.",
          "Broker realizuje Twoje zlecenia.",
        ],
      },
      {
        type: "quote",
        text: "Broker daje dostęp do rynku — ale nie daje przewagi.",
      },
      {
        type: "checklist",
        items: [
          { text: "Rozumiem rolę brokera." },
          { text: "Wiem, że broker nie odpowiada za mój plan tradingowy." },
          { text: "Wiem, że muszę znać koszty handlu." },
        ],
      },
      {
        type: "cta",
        text: "Sprawdź u swojego brokera: spread, prowizję i minimalną wielkość pozycji.",
      },
    ],
  },

  "m0-l6-jak-powstaje-cena": {
    blocks: [
      { type: "h2", text: "Jak powstaje cena na rynku?" },
      {
        type: "p",
        text: "Cena porusza się, ponieważ kupujący i sprzedający zawierają transakcje po różnych poziomach. To efekt ciągłej walki popytu i podaży.",
      },
      {
        type: "bullets",
        items: [
          "Większa agresja kupujących pcha cenę w górę.",
          "Większa agresja sprzedających spycha cenę w dół.",
          "Cena szuka miejsc, gdzie jest płynność i zainteresowanie uczestników rynku.",
        ],
      },
      {
        type: "quote",
        text: "Cena nie rusza się przypadkowo. Cena rusza się tam, gdzie są decyzje.",
      },
      {
        type: "cta",
        text: "Otwórz wykres i zaznacz 3 miejsca, gdzie cena wyraźnie przyspieszyła. Zastanów się, dlaczego.",
      },
    ],
  },

  // =========================
  // MODUŁ 1 — PLATFORMA TRADINGOWA
  // =========================
  "m1-l1-tradingview-podstawy": {
    blocks: [
      { type: "h2", text: "TradingView — podstawy" },
      {
        type: "p",
        text: "TradingView to narzędzie do analizy wykresów. Tutaj oznaczasz poziomy, obserwujesz strukturę i przygotowujesz scenariusze.",
      },
      {
        type: "bullets",
        items: [
          "To miejsce do analizy, nie do emocjonalnego klikania.",
          "Musisz umieć zmieniać instrument, timeframe i rysować poziomy.",
          "Dobrze zorganizowany wykres daje Ci spokój decyzyjny.",
        ],
      },
      { type: "quote", text: "Czysty wykres = czystsza decyzja." },
      {
        type: "checklist",
        items: [
          { text: "Potrafię zmienić instrument." },
          { text: "Potrafię zmienić timeframe." },
          { text: "Potrafię narysować poziom i trendline." },
        ],
      },
      {
        type: "cta",
        text: "Otwórz TradingView i przygotuj czysty wykres EUR/USD na M5.",
      },
    ],
  },

  "m1-l2-mt4-mt5": {
    blocks: [
      { type: "h2", text: "MT4 / MT5 — jak działa platforma" },
      {
        type: "p",
        text: "MetaTrader to platforma do wykonywania zleceń. Tu otwierasz, zarządzasz i zamykasz swoje pozycje.",
      },
      {
        type: "bullets",
        items: [
          "TradingView służy głównie do analizy.",
          "MT4 / MT5 służy głównie do egzekucji.",
          "Musisz znać okno zleceń, SL, TP i zarządzanie pozycją.",
        ],
      },
      {
        type: "quote",
        text: "Analiza i egzekucja to dwa różne etapy tej samej decyzji.",
      },
      {
        type: "cta",
        text: "Wejdź na demo i otwórz testowe zlecenie z ustawionym SL oraz TP.",
      },
    ],
  },

  "m1-l3-jak-otworzyc-trade": {
    blocks: [
      { type: "h2", text: "Jak otworzyć trade" },
      {
        type: "p",
        text: "Otwieranie pozycji powinno być końcem procesu, a nie początkiem. Najpierw analiza, potem decyzja, na końcu kliknięcie.",
      },
      {
        type: "checklist",
        items: [
          { text: "Mam jasny bias." },
          { text: "Mam konkretny setup." },
          { text: "Znam miejsce SL." },
          { text: "Znam target lub logikę wyjścia." },
        ],
      },
      {
        type: "quote",
        text: "Kliknięcie buy lub sell nie jest strategią.",
      },
      {
        type: "cta",
        text: "Na demo otwórz jedną pozycję dopiero po przejściu całej checklisty.",
      },
    ],
  },

  "m1-l4-stop-loss-take-profit": {
    blocks: [
      { type: "h2", text: "Stop Loss i Take Profit" },
      {
        type: "p",
        text: "Stop Loss chroni konto, a Take Profit porządkuje realizację zysku. Oba muszą wynikać z logiki rynku, nie z emocji.",
      },
      {
        type: "bullets",
        items: [
          "SL nie może być przypadkowy.",
          "TP powinien wynikać ze struktury lub planu RR.",
          "Brak SL to brak kontroli nad ryzykiem.",
        ],
      },
      {
        type: "quote",
        text: "Trader bez Stop Lossa oddaje kontrolę rynkowi.",
      },
      {
        type: "cta",
        text: "Zrób 3 przykłady wejścia z logicznym SL i TP na wykresie.",
      },
    ],
  },

  "m1-l5-typy-zlecen": {
    blocks: [
      { type: "h2", text: "Typy zleceń: market / limit / stop" },
      {
        type: "p",
        text: "Każde zlecenie ma inne zastosowanie. Musisz wiedzieć, kiedy chcesz wejść od razu, a kiedy dopiero po dojściu ceny do poziomu.",
      },
      {
        type: "bullets",
        items: [
          "Market — wejście natychmiast po aktualnej cenie.",
          "Limit — wejście po lepszej cenie przy cofnięciu.",
          "Stop — wejście po wybiciu określonego poziomu.",
        ],
      },
      {
        type: "cta",
        text: "Na demo porównaj otwarcie trade marketem i zleceniem oczekującym.",
      },
    ],
  },

  "m1-l6-zarzadzanie-pozycja": {
    blocks: [
      { type: "h2", text: "Zarządzanie pozycją" },
      {
        type: "p",
        text: "Po wejściu w trade Twoim celem nie jest panika, tylko egzekucja planu. Zarządzanie pozycją musi być oparte na zasadach.",
      },
      {
        type: "bullets",
        items: [
          "Nie przesuwaj SL bez powodu.",
          "Nie zamykaj zysku tylko dlatego, że się boisz.",
          "Nie trzymaj straty w nadziei, że wróci.",
        ],
      },
      {
        type: "quote",
        text: "Najwięcej błędów trader popełnia po wejściu w pozycję.",
      },
      {
        type: "cta",
        text: "Przeanalizuj swój ostatni trade i zapisz, czy zarządzałeś nim zgodnie z planem.",
      },
    ],
  },

  // =========================
  // MODUŁ 2 — WYKRESY I TIMEFRAME
  // =========================
  "m2-l1-typy-wykresow": {
    blocks: [
      { type: "h2", text: "Typy wykresów" },
      {
        type: "p",
        text: "W tradingu najczęściej używa się wykresów świecowych, bo pokazują najwięcej informacji o zachowaniu ceny.",
      },
      {
        type: "bullets",
        items: [
          "Wykres liniowy pokazuje ogólny kierunek.",
          "Wykres słupkowy daje więcej szczegółów.",
          "Wykres świecowy najlepiej pokazuje dynamikę ceny.",
        ],
      },
      {
        type: "quote",
        text: "Świece pokazują historię decyzji kupujących i sprzedających.",
      },
      {
        type: "cta",
        text: "Porównaj ten sam rynek na wykresie liniowym i świecowym.",
      },
    ],
  },

  "m2-l2-timeframe": {
    blocks: [
      { type: "h2", text: "Timeframe — jak go używać" },
      {
        type: "p",
        text: "Timeframe to przedział czasu, z którego budowana jest jedna świeca. Inny timeframe daje inny poziom szczegółowości.",
      },
      {
        type: "bullets",
        items: [
          "Wyższy timeframe daje szerszy kontekst.",
          "Niższy timeframe daje dokładniejszy timing.",
          "Nie zaczynaj od najniższego interwału.",
        ],
      },
      { type: "quote", text: "Najpierw kontekst, potem precyzja." },
      {
        type: "cta",
        text: "Przełącz jeden wykres między M1, M5 i H1 i opisz różnicę.",
      },
    ],
  },

  "m2-l3-swiece-japonskie": {
    blocks: [
      { type: "h2", text: "Świece japońskie" },
      {
        type: "p",
        text: "Każda świeca pokazuje otwarcie, zamknięcie, maksimum i minimum ceny w danym czasie. To podstawowy język price action.",
      },
      {
        type: "bullets",
        items: [
          "Korpus świecy pokazuje różnicę między open i close.",
          "Knoty pokazują odrzucenie lub test poziomów.",
          "Duży korpus często oznacza siłę jednej strony rynku.",
        ],
      },
      {
        type: "cta",
        text: "Znajdź na wykresie 3 świece impulsowe i 3 świece z wyraźnym knotem.",
      },
    ],
  },

  "m2-l4-jak-czytac-swiece": {
    blocks: [
      { type: "h2", text: "Jak czytać świeczki" },
      {
        type: "p",
        text: "Nie patrz tylko na kolor świecy. Liczy się jej rozmiar, położenie i reakcja ceny po jej zamknięciu.",
      },
      {
        type: "bullets",
        items: [
          "Jedna świeca nic nie znaczy bez kontekstu.",
          "Mocne zamknięcie przy skraju świecy daje informację o przewadze.",
          "Długi knot może oznaczać odrzucenie poziomu.",
        ],
      },
      {
        type: "quote",
        text: "Świeca ma sens tylko w kontekście miejsca i struktury.",
      },
      {
        type: "cta",
        text: "Weź 5 świec z wykresu i opisz, co mówią o zachowaniu ceny.",
      },
    ],
  },

  "m2-l5-struktura-swiecy": {
    blocks: [
      { type: "h2", text: "Struktura świecy" },
      {
        type: "p",
        text: "Każda świeca składa się z korpusu i knotów. To prosty zapis tego, kto miał przewagę w danym fragmencie czasu.",
      },
      {
        type: "checklist",
        items: [
          { text: "Rozumiem różnicę między korpusem a knotem." },
          { text: "Potrafię zauważyć odrzucenie poziomu." },
          { text: "Potrafię zauważyć świecę impulsową." },
        ],
      },
      {
        type: "cta",
        text: "Otwórz wykres i zaznacz 3 świece z długim górnym knotem oraz 3 z długim dolnym knotem.",
      },
    ],
  },

  "m2-l6-momentum-swiec": {
    blocks: [
      { type: "h2", text: "Momentum świec" },
      {
        type: "p",
        text: "Momentum pokazuje siłę ruchu. Kiedy świece są duże, agresywne i zamykają się blisko skrajów, rynek pokazuje zdecydowanie.",
      },
      {
        type: "bullets",
        items: [
          "Duże świece = wysoka agresja jednej strony.",
          "Małe świece = spowolnienie lub brak decyzji.",
          "Seria świec impulsowych często pokazuje dominację strony rynku.",
        ],
      },
      {
        type: "quote",
        text: "Momentum nie mówi tylko dokąd rynek idzie. Mówi jak bardzo chce tam iść.",
      },
      {
        type: "cta",
        text: "Znajdź 3 miejsca mocnego momentum i 3 miejsca wyhamowania ceny.",
      },
    ],
  },

  // =========================
  // MODUŁ 3 — STRUKTURA RYNKU
  // =========================
  "m3-l1-hh-hl-lh-ll": {
    blocks: [
      { type: "h2", text: "HH / HL vs LH / LL" },
      {
        type: "p",
        text: "To podstawowy model czytania struktury rynku. Dzięki niemu określasz, kto aktualnie ma przewagę: kupujący czy sprzedający.",
      },
      {
        type: "bullets",
        items: [
          "HH + HL oznacza przewagę strony kupującej.",
          "LH + LL oznacza przewagę strony sprzedającej.",
          "Brak jasnego schematu oznacza brak przewagi.",
        ],
      },
      {
        type: "quote",
        text: "Struktura wybiera stronę. Trader ma tylko ją odczytać.",
      },
      {
        type: "checklist",
        items: [
          { text: "Potrafię znaleźć HH." },
          { text: "Potrafię znaleźć HL." },
          { text: "Potrafię znaleźć LH i LL." },
        ],
      },
      {
        type: "cta",
        text: "Zrób 3 screenshoty: trend wzrostowy, trend spadkowy i brak struktury.",
      },
    ],
  },

  "m3-l2-jak-rozpoznac-trend": {
    blocks: [
      { type: "h2", text: "Jak rozpoznać trend" },
      {
        type: "p",
        text: "Trend to nie tylko kierunek. Trend to powtarzalny układ struktury i kontynuacji ceny.",
      },
      {
        type: "bullets",
        items: [
          "Trend wzrostowy = seria HH i HL.",
          "Trend spadkowy = seria LH i LL.",
          "Brak kontynuacji = możliwy range lub zmiana struktury.",
        ],
      },
      {
        type: "cta",
        text: "Przejrzyj 10 wykresów i oznacz, czy rynek jest w trendzie czy nie.",
      },
    ],
  },

  "m3-l3-zmiana-struktury": {
    blocks: [
      { type: "h2", text: "Zmiana struktury rynku" },
      {
        type: "p",
        text: "Zmiana struktury pojawia się wtedy, gdy rynek przestaje kontynuować dotychczasowy układ i zaczyna tworzyć nowy.",
      },
      {
        type: "bullets",
        items: [
          "Trend nie trwa wiecznie.",
          "Pierwszy sygnał zmiany to złamanie dotychczasowego schematu.",
          "Nie każda zmiana struktury oznacza od razu odwrócenie trendu.",
        ],
      },
      {
        type: "quote",
        text: "Najpierw rynek przestaje kontynuować. Dopiero potem zmienia kierunek.",
      },
      {
        type: "cta",
        text: "Znajdź 3 przykłady przejścia z trendu do zmiany struktury.",
      },
    ],
  },

  "m3-l4-bos": {
    blocks: [
      { type: "h2", text: "BOS — Break of Structure" },
      {
        type: "p",
        text: "BOS to wybicie ważnego punktu struktury i sygnał, że aktualny kierunek może być kontynuowany lub właśnie został potwierdzony.",
      },
      {
        type: "bullets",
        items: [
          "BOS potwierdza kontynuację struktury.",
          "Nie każde wybicie jest jakościowym BOS.",
          "Liczy się miejsce i kontekst wybicia.",
        ],
      },
      {
        type: "cta",
        text: "Znajdź na wykresie 5 przykładów BOS i opisz, czy były jakościowe.",
      },
    ],
  },

  "m3-l5-choch": {
    blocks: [
      { type: "h2", text: "CHoCH — Change of Character" },
      {
        type: "p",
        text: "CHoCH to pierwszy sygnał, że zachowanie rynku może się zmieniać. To jeszcze nie pełny trend, ale ważne ostrzeżenie.",
      },
      {
        type: "bullets",
        items: [
          "CHoCH często pojawia się przed większą zmianą.",
          "Nie wystarczy sam sygnał — potrzebny jest kontekst.",
          "To narzędzie do obserwacji, nie do ślepego wejścia.",
        ],
      },
      { type: "quote", text: "CHoCH ostrzega. Struktura potwierdza." },
      {
        type: "cta",
        text: "Znajdź 3 przykłady CHoCH i sprawdź, co rynek zrobił później.",
      },
    ],
  },

  "m3-l6-struktura-w-praktyce": {
    blocks: [
      { type: "h2", text: "Struktura w praktyce" },
      {
        type: "p",
        text: "Najważniejsze jest zastosowanie struktury w realnej analizie, a nie tylko znajomość definicji.",
      },
      {
        type: "checklist",
        items: [
          { text: "Najpierw patrzę na ogólny kierunek." },
          { text: "Potem zaznaczam kluczowe swingi." },
          { text: "Na końcu oceniam, czy mam przewagę." },
        ],
      },
      {
        type: "quote",
        text: "Definicje są proste. Trudna jest dyscyplina czytania rynku tak samo każdego dnia.",
      },
      {
        type: "cta",
        text: "Weź 10 wykresów i rozpisz na każdym: struktura, bias, punkt reakcji.",
      },
    ],
  },

  // =========================
  // MODUŁ 4 — TREND
  // =========================
  "m4-l1-co-to-jest-trend": {
    blocks: [
      { type: "h2", text: "Co to jest trend?" },
      {
        type: "p",
        text: "Trend to dominujący kierunek ruchu ceny. Nie chodzi tylko o to, że rynek rośnie lub spada, ale o to, czy robi to w uporządkowany sposób.",
      },
      {
        type: "bullets",
        items: [
          "Trend wzrostowy = HH + HL.",
          "Trend spadkowy = LH + LL.",
          "Brak kontynuacji struktury = brak czytelnego trendu.",
        ],
      },
      { type: "quote", text: "Trend to nie opinia. Trend to struktura." },
      {
        type: "checklist",
        items: [
          { text: "Widzę sekwencję HH i HL albo LH i LL." },
          { text: "Rynek nie jest chaotyczny." },
          { text: "Potrafię wskazać kierunek przewagi." },
        ],
      },
      {
        type: "cta",
        text: "Znajdź na wykresie 2 trendy wzrostowe i 2 spadkowe.",
      },
    ],
  },

  "m4-l2-trend-vs-konsolidacja": {
    blocks: [
      { type: "h2", text: "Trend vs konsolidacja" },
      {
        type: "p",
        text: "Jednym z najważniejszych filtrów tradera jest odróżnienie trendu od konsolidacji. W trendzie masz przewagę kierunkową, w konsolidacji często jej nie masz.",
      },
      {
        type: "bullets",
        items: [
          "Trend ma kierunek i kontynuację.",
          "Konsolidacja ma chaos i brak kontynuacji.",
          "W środku range traderzy najczęściej tracą.",
        ],
      },
      {
        type: "quote",
        text: "Nie musisz być ciągle w rynku. Musisz być w dobrym rynku.",
      },
      {
        type: "cta",
        text: "Przejrzyj 10 wykresów i oznacz: trend albo konsolidacja.",
      },
    ],
  },

  "m4-l3-jak-okreslic-bias": {
    blocks: [
      { type: "h2", text: "Jak określić bias rynku" },
      {
        type: "p",
        text: "Bias to kierunek, w którym chcesz szukać wejść. Bias nie daje wejścia, ale eliminuje dużą część słabych decyzji.",
      },
      {
        type: "bullets",
        items: [
          "Bias budujesz z kontekstu i struktury.",
          "Najpierw określasz stronę, dopiero potem szukasz setupu.",
          "Bias powinien być prosty: LONG, SHORT albo brak trade.",
        ],
      },
      {
        type: "checklist",
        items: [
          { text: "Sprawdziłem strukturę na wyższym TF." },
          { text: "Znam ostatni ważny swing." },
          { text: "Wiem, po której stronie szukam wejścia." },
        ],
      },
      {
        type: "quote",
        text: "Bias nie daje zysku. Bias chroni przed głupimi wejściami.",
      },
      {
        type: "cta",
        text: "Na 5 wykresach opisz bias: LONG / SHORT / brak trade.",
      },
    ],
  },

  "m4-l4-kiedy-nie-handlowac": {
    blocks: [
      { type: "h2", text: "Kiedy nie handlować" },
      {
        type: "p",
        text: "Dojrzały trader nie tylko wie kiedy wejść, ale też kiedy odpuścić. Brak wejścia to też decyzja tradingowa.",
      },
      {
        type: "bullets",
        items: [
          "Nie handluj w środku konsolidacji.",
          "Nie handluj bez biasu.",
          "Nie handluj, gdy jesteś pod wpływem emocji.",
          "Nie handluj tylko dlatego, że dawno nie było trade.",
        ],
      },
      {
        type: "quote",
        text: "Najdroższe trade to te, których nie powinno być.",
      },
      {
        type: "cta",
        text: "Zapisz 5 sytuacji, w których Twój plan mówi: NIE GRAM.",
      },
    ],
  },

  "m4-l5-trend-na-roznych-timeframe": {
    blocks: [
      { type: "h2", text: "Trend na różnych timeframe" },
      {
        type: "p",
        text: "Trend może wyglądać inaczej na różnych interwałach. Dlatego musisz rozumieć zależność między wyższym i niższym timeframe.",
      },
      {
        type: "bullets",
        items: [
          "Na wyższym TF widzisz kontekst.",
          "Na niższym TF widzisz dokładny timing.",
          "Nie oceniaj rynku tylko po jednym interwale.",
        ],
      },
      {
        type: "quote",
        text: "Wyższy timeframe mówi co. Niższy timeframe mówi kiedy.",
      },
      {
        type: "cta",
        text: "Porównaj ten sam rynek na H1, M15 i M5.",
      },
    ],
  },

  "m4-l6-multi-timeframe-analysis": {
    blocks: [
      { type: "h2", text: "Multi Timeframe Analysis" },
      {
        type: "p",
        text: "Analiza wielointerwałowa pomaga połączyć kontekst z precyzją wejścia. To jedna z najważniejszych umiejętności w tradingu intraday.",
      },
      {
        type: "checklist",
        items: [
          { text: "Najpierw sprawdzam wyższy timeframe." },
          { text: "Potem określam bias." },
          { text: "Na końcu schodzę niżej po setup." },
        ],
      },
      {
        type: "quote",
        text: "Bez hierarchii timeframe trader wpada w chaos.",
      },
      {
        type: "cta",
        text: "Przeanalizuj 1 rynek w schemacie: H1 → M15 → M5 → M1.",
      },
    ],
  },

  // =========================
  // MODUŁ 5 — PRICE ACTION
  // =========================
  "m5-l1-podstawy-price-action": {
    blocks: [
      { type: "h2", text: "Podstawy price action" },
      {
        type: "p",
        text: "Price action to czytanie zachowania ceny bez polegania wyłącznie na wskaźnikach. Patrzysz na to, jak rynek reaguje, przyspiesza i odrzuca poziomy.",
      },
      {
        type: "bullets",
        items: [
          "Cena zostawia ślad decyzji uczestników rynku.",
          "Price action trzeba czytać w kontekście miejsca.",
          "Nie każda świeca jest sygnałem.",
        ],
      },
      {
        type: "quote",
        text: "Najpierw miejsce. Potem reakcja. Dopiero na końcu decyzja.",
      },
      {
        type: "cta",
        text: "Na 5 wykresach zaznacz miejsca reakcji ceny.",
      },
    ],
  },

  "m5-l2-momentum-ceny": {
    blocks: [
      { type: "h2", text: "Momentum ceny" },
      {
        type: "p",
        text: "Momentum pokazuje siłę ruchu. Gdy rynek porusza się szybko i agresywnie, często oznacza to dominację jednej strony.",
      },
      {
        type: "bullets",
        items: [
          "Duże świece pokazują siłę.",
          "Szybkie wybicie poziomu pokazuje agresję.",
          "Słabnące momentum ostrzega przed wyhamowaniem.",
        ],
      },
      {
        type: "quote",
        text: "Momentum mówi nie tylko dokąd rynek idzie, ale jak mocno chce tam iść.",
      },
      {
        type: "cta",
        text: "Znajdź 3 przykłady mocnego i 3 przykłady słabego momentum.",
      },
    ],
  },

  "m5-l3-pin-bar": {
    blocks: [
      { type: "h2", text: "Pin bar" },
      {
        type: "p",
        text: "Pin bar to świeca pokazująca odrzucenie poziomu. Sama w sobie nie wystarczy — musi pojawić się w dobrym miejscu.",
      },
      {
        type: "bullets",
        items: [
          "Długi knot pokazuje odrzucenie.",
          "Mały korpus wzmacnia przekaz świecy.",
          "Najważniejsze jest miejsce pojawienia się pin bara.",
        ],
      },
      {
        type: "quote",
        text: "Pin bar w złym miejscu to tylko świeca. Pin bar w dobrym miejscu to informacja.",
      },
      {
        type: "cta",
        text: "Znajdź 5 pin barów i oceń, które miały sens, a które nie.",
      },
    ],
  },

  "m5-l4-engulfing": {
    blocks: [
      { type: "h2", text: "Engulfing" },
      {
        type: "p",
        text: "Engulfing to świeca, która przykrywa poprzednią i pokazuje przejęcie kontroli przez jedną stronę rynku.",
      },
      {
        type: "bullets",
        items: [
          "Silne zamknięcie zwiększa jakość sygnału.",
          "Najważniejszy jest kontekst i miejsce.",
          "Engulfing bez kontekstu nie daje przewagi.",
        ],
      },
      {
        type: "quote",
        text: "Nie handlujesz wzoru. Handlujesz historię, którą wzór opowiada.",
      },
      {
        type: "cta",
        text: "Znajdź 5 engulfingów na wykresie i opisz ich kontekst.",
      },
    ],
  },

  "m5-l5-fake-breakout": {
    blocks: [
      { type: "h2", text: "Fake breakout" },
      {
        type: "p",
        text: "Fałszywe wybicie to sytuacja, w której rynek narusza poziom, przyciąga traderów, a potem szybko wraca. To częsty mechanizm zbierania płynności.",
      },
      {
        type: "bullets",
        items: [
          "Rynek wybija poziom tylko pozornie.",
          "Po wybiciu szybko wraca do środka.",
          "Traderzy łapią się na pozorne potwierdzenie.",
        ],
      },
      {
        type: "quote",
        text: "Najbardziej oczywiste wybicie często jest pułapką.",
      },
      {
        type: "cta",
        text: "Znajdź 3 fake breakouty i opisz, gdzie traderzy mogli zostać złapani.",
      },
    ],
  },

  "m5-l6-price-action-w-praktyce": {
    blocks: [
      { type: "h2", text: "Price action w praktyce" },
      {
        type: "p",
        text: "Price action działa najlepiej wtedy, gdy łączysz je ze strukturą i miejscem reakcji. Sama świeca nie wystarcza.",
      },
      {
        type: "checklist",
        items: [
          { text: "Mam strukturę." },
          { text: "Mam dobre miejsce reakcji." },
          { text: "Widzę potwierdzenie price action." },
        ],
      },
      {
        type: "quote",
        text: "Price action bez kontekstu zamienia analizę w zgadywanie.",
      },
      {
        type: "cta",
        text: "Przygotuj 5 analiz: struktura + miejsce + reakcja price action.",
      },
    ],
  },

  // =========================
  // MODUŁ 6 — SETUP TRADINGOWY
  // =========================
  "m6-l1-co-to-jest-setup": {
    blocks: [
      { type: "h2", text: "Co to jest setup tradingowy" },
      {
        type: "p",
        text: "Setup tradingowy to konkretna, powtarzalna sytuacja rynkowa, która spełnia Twoje warunki wejścia. Setup ma być opisany i mierzalny.",
      },
      {
        type: "bullets",
        items: [
          "Setup musi być powtarzalny.",
          "Setup musi mieć warunki wejścia i unieważnienia.",
          "Setup bez zasad nie jest setupem.",
        ],
      },
      {
        type: "quote",
        text: "Nie handlujesz rynku. Handlujesz swój setup na rynku.",
      },
      {
        type: "cta",
        text: "Zapisz własnymi słowami: co musi się wydarzyć, żebyś nazwał coś setupem.",
      },
    ],
  },

  "m6-l2-setup-1-2-3": {
    blocks: [
      { type: "h2", text: "Setup 1-2-3" },
      {
        type: "p",
        text: "To prosty schemat wejścia oparty na impulsie, korekcie i potwierdzeniu powrotu ceny do kierunku biasu.",
      },
      {
        type: "bullets",
        items: [
          "1 — impuls po stronie biasu.",
          "2 — korekta lub cofnięcie.",
          "3 — potwierdzenie powrotu do kierunku ruchu.",
        ],
      },
      {
        type: "quote",
        text: "Nie gonię ceny. Czekam aż rynek pokaże strukturę wejścia.",
      },
      {
        type: "cta",
        text: "Znajdź 5 setupów 1-2-3 na wykresie i opisz każdy krok.",
      },
    ],
  },

  "m6-l3-breakout": {
    blocks: [
      { type: "h2", text: "Breakout" },
      {
        type: "p",
        text: "Breakout to wybicie ważnego poziomu, po którym rynek może kontynuować ruch. Nie każde wybicie ma jednak wartość.",
      },
      {
        type: "bullets",
        items: [
          "Liczy się jakość poziomu.",
          "Liczy się momentum wybicia.",
          "Liczy się to, co rynek robi po wybiciu.",
        ],
      },
      {
        type: "quote",
        text: "Breakout bez kontekstu to zaproszenie do pułapki.",
      },
      {
        type: "cta",
        text: "Porównaj 3 mocne breakouty i 3 słabe.",
      },
    ],
  },

  "m6-l4-retest": {
    blocks: [
      { type: "h2", text: "Retest" },
      {
        type: "p",
        text: "Retest to powrót ceny do wcześniej wybitego poziomu. Daje bardziej spokojne i często czytelniejsze wejście niż gonienie impulsu.",
      },
      {
        type: "bullets",
        items: [
          "Najpierw musi być wybicie.",
          "Potem rynek wraca do poziomu.",
          "Na końcu szukasz potwierdzenia reakcji.",
        ],
      },
      { type: "quote", text: "Retest nagradza cierpliwych." },
      {
        type: "cta",
        text: "Znajdź 5 przykładów dobrego retestu i 3 przykłady fałszywego.",
      },
    ],
  },

  "m6-l5-falszywe-wybicie": {
    blocks: [
      { type: "h2", text: "Fałszywe wybicie" },
      {
        type: "p",
        text: "Fałszywe wybicie wygląda jak potwierdzenie, ale szybko okazuje się pułapką. Trader musi nauczyć się odróżniać jakość od pozoru.",
      },
      {
        type: "bullets",
        items: [
          "Brak kontynuacji po wybiciu to ostrzeżenie.",
          "Powrót do środka zakresu osłabia sygnał.",
          "Słabe momentum po wybiciu często zwiastuje problem.",
        ],
      },
      {
        type: "quote",
        text: "Rynek lubi pokazać oczywisty ruch po to, żeby go zanegować.",
      },
      {
        type: "cta",
        text: "Znajdź 3 fałszywe wybicia i zapisz, co było sygnałem ostrzegawczym.",
      },
    ],
  },

  "m6-l6-checklist-setupu": {
    blocks: [
      { type: "h2", text: "Checklist setupu" },
      {
        type: "p",
        text: "Dobry trader ma checklistę. Dzięki niej nie podejmuje decyzji impulsywnie, tylko przechodzi przez stały proces.",
      },
      {
        type: "checklist",
        items: [
          { text: "Mam bias." },
          { text: "Mam strukturę." },
          { text: "Mam dobre miejsce reakcji." },
          { text: "Mam konkretny trigger wejścia." },
          { text: "Znam SL i logikę wyjścia." },
        ],
      },
      {
        type: "quote",
        text: "Checklist nie gwarantuje zysku. Checklist chroni przed chaosem.",
      },
      {
        type: "cta",
        text: "Stwórz własną checklistę setupu i porównaj ją z 5 ostatnimi trade.",
      },
    ],
  },

  // =========================
  // MODUŁ 7 — TIMING
  // =========================
  "m7-l1-timing-wejscia": {
    blocks: [
      { type: "h2", text: "Timing wejścia" },
      {
        type: "p",
        text: "Timing wejścia to moment, w którym decydujesz się wejść w pozycję. Nawet dobry kierunek rynku może dać słaby trade, jeśli wejdziesz za wcześnie albo za późno.",
      },
      {
        type: "bullets",
        items: [
          "Najpierw musisz mieć kontekst i bias.",
          "Dopiero potem szukasz momentu wejścia.",
          "Timing nie zastępuje analizy — on ją doprecyzowuje.",
        ],
      },
      {
        type: "quote",
        text: "Dobry trade to nie tylko kierunek. To także właściwy moment.",
      },
      {
        type: "checklist",
        items: [
          { text: "Mam jasno określony bias." },
          { text: "Widzę logiczne miejsce reakcji." },
          { text: "Nie gonię ceny impulsywnie." },
        ],
      },
      {
        type: "cta",
        text: "Znajdź 3 przykłady dobrego timing wejścia i 3 przykłady spóźnionego wejścia.",
      },
    ],
  },

  "m7-l2-wejscia-na-m1": {
    blocks: [
      { type: "h2", text: "Wejścia na M1" },
      {
        type: "p",
        text: "M1 daje bardzo precyzyjny timing, ale łatwo na nim wpaść w chaos. Dlatego wejścia na M1 mają sens tylko wtedy, gdy wyższy timeframe daje jasny kontekst.",
      },
      {
        type: "bullets",
        items: [
          "M1 służy do precyzji, nie do budowania biasu.",
          "Na M1 szybciej widać reakcję ceny.",
          "Bez filtra z wyższego TF M1 generuje za dużo szumu.",
        ],
      },
      {
        type: "quote",
        text: "M1 daje timing. Nie daje przewagi sam z siebie.",
      },
      {
        type: "checklist",
        items: [
          { text: "Bias mam z wyższego timeframe." },
          { text: "M1 wykorzystuję tylko do dopracowania wejścia." },
          {
            text: "Nie zmieniam planu tylko dlatego, że M1 wygląda dynamicznie.",
          },
        ],
      },
      {
        type: "cta",
        text: "Przeanalizuj 5 wejść na M1 i oceń, czy były zgodne z kontekstem z wyższego TF.",
      },
    ],
  },

  "m7-l3-wejscia-na-m5": {
    blocks: [
      { type: "h2", text: "Wejścia na M5" },
      {
        type: "p",
        text: "M5 jest spokojniejszy niż M1 i często lepiej nadaje się dla początkującego tradera. Daje mniej szumu i bardziej czytelne struktury wejścia.",
      },
      {
        type: "bullets",
        items: [
          "M5 jest wolniejszy, ale często czytelniejszy.",
          "Na M5 łatwiej utrzymać dyscyplinę.",
          "Wejścia na M5 zwykle mają szerszy SL niż na M1.",
        ],
      },
      {
        type: "quote",
        text: "Nie zawsze szybszy timeframe oznacza lepszy trade.",
      },
      {
        type: "cta",
        text: "Porównaj ten sam rynek na M1 i M5 i opisz, gdzie wejście było czytelniejsze.",
      },
    ],
  },

  "m7-l4-potwierdzenie-wejscia": {
    blocks: [
      { type: "h2", text: "Potwierdzenie wejścia" },
      {
        type: "p",
        text: "Potwierdzenie wejścia to sygnał, że rynek rzeczywiście reaguje zgodnie z Twoim scenariuszem. Nie chodzi o perfekcję, tylko o zwiększenie jakości decyzji.",
      },
      {
        type: "bullets",
        items: [
          "Potwierdzeniem może być reakcja świecowa.",
          "Potwierdzeniem może być wybicie micro-structure.",
          "Potwierdzenie ma sens tylko w dobrym miejscu.",
        ],
      },
      {
        type: "quote",
        text: "Najpierw miejsce. Potem potwierdzenie. Dopiero później wejście.",
      },
      {
        type: "checklist",
        items: [
          { text: "Cena doszła do logicznego poziomu." },
          { text: "Widzę reakcję lub odrzucenie." },
          { text: "Nie wchodzę bez sygnału tylko z nadziei." },
        ],
      },
      {
        type: "cta",
        text: "Na 5 wykresach zaznacz poziom i opisz, co było realnym potwierdzeniem wejścia.",
      },
    ],
  },

  "m7-l5-moment-impulsu": {
    blocks: [
      { type: "h2", text: "Moment impulsu" },
      {
        type: "p",
        text: "Impuls to faza, w której jedna strona rynku przejmuje kontrolę i cena rusza dynamicznie. Wejście w moment impulsu bez planu często kończy się gonieniem ceny.",
      },
      {
        type: "bullets",
        items: [
          "Impuls pokazuje dominację jednej strony.",
          "Najgorszy timing to wejście po emocjonalnym pościgu za świecą.",
          "Często lepiej poczekać na cofnięcie niż gonić impuls.",
        ],
      },
      {
        type: "quote",
        text: "Nie każdy impuls jest zaproszeniem do wejścia.",
      },
      {
        type: "cta",
        text: "Znajdź 3 impulsy, które warto było wykorzystać, i 3 impulsy, których nie warto było gonić.",
      },
    ],
  },

  "m7-l6-idealny-moment-wejscia": {
    blocks: [
      { type: "h2", text: "Idealny moment wejścia" },
      {
        type: "p",
        text: "Idealny moment wejścia to punkt, w którym kontekst, miejsce i reakcja ceny składają się w jedną decyzję. Nie chodzi o perfekcyjny trade, tylko o powtarzalny proces.",
      },
      {
        type: "bullets",
        items: [
          "Masz bias i strukturę.",
          "Masz miejsce reakcji.",
          "Masz trigger wejścia.",
          "Masz logiczny SL i plan wyjścia.",
        ],
      },
      {
        type: "quote",
        text: "Idealny timing to efekt procesu, nie przypadku.",
      },
      {
        type: "checklist",
        items: [
          { text: "Mam kontekst rynku." },
          { text: "Mam czytelny setup." },
          { text: "Mam potwierdzenie." },
          { text: "Nie wchodzę z FOMO." },
        ],
      },
      {
        type: "cta",
        text: "Przygotuj własną definicję idealnego wejścia i porównaj ją z 5 ostatnimi trade.",
      },
    ],
  },

  // =========================
  // MODUŁ 8 — LIQUIDITY
  // =========================
  "m8-l1-czym-jest-liquidity": {
    blocks: [
      { type: "h2", text: "Czym jest liquidity?" },
      {
        type: "p",
        text: "Liquidity (płynność) oznacza miejsca na rynku, gdzie znajdują się zlecenia innych uczestników. To właśnie tam rynek najczęściej kieruje cenę, ponieważ duże instytucje potrzebują płynności, aby realizować swoje transakcje.",
      },
      {
        type: "bullets",
        items: [
          "Liquidity to miejsca gdzie znajdują się stop lossy.",
          "Liquidity to miejsca gdzie traderzy otwierają pozycje.",
          "Duzi gracze potrzebują płynności aby realizować duże zlecenia.",
        ],
      },
      {
        type: "quote",
        text: "Rynek nie porusza się przypadkowo. Rynek porusza się tam, gdzie jest płynność.",
      },
      {
        type: "cta",
        text: "Na wykresie zaznacz 5 miejsc gdzie prawdopodobnie znajduje się liquidity.",
      },
    ],
  },

  "m8-l2-gdzie-jest-liquidity": {
    blocks: [
      { type: "h2", text: "Gdzie znajduje się liquidity?" },
      {
        type: "p",
        text: "Płynność najczęściej znajduje się w miejscach oczywistych dla większości traderów. Tam gdzie wielu traderów ustawia swoje stop lossy lub oczekujące zlecenia.",
      },
      {
        type: "bullets",
        items: [
          "Nad ostatnimi swing high.",
          "Pod ostatnimi swing low.",
          "Nad lokalnymi range.",
          "Pod lokalnymi range.",
        ],
      },
      {
        type: "quote",
        text: "Najbardziej oczywiste miejsca na wykresie często są miejscami płynności.",
      },
      {
        type: "cta",
        text: "Znajdź na wykresie 5 swing high i swing low i zaznacz gdzie mogą znajdować się stop lossy.",
      },
    ],
  },

  "m8-l3-liquidity-sweep": {
    blocks: [
      { type: "h2", text: "Liquidity Sweep" },
      {
        type: "p",
        text: "Liquidity sweep to moment, gdy cena wybija poziom tylko po to, aby zebrać stop lossy traderów, a następnie wraca w przeciwnym kierunku.",
      },
      {
        type: "bullets",
        items: [
          "Cena wybija poziom.",
          "Stop lossy zostają aktywowane.",
          "Cena często wraca w przeciwną stronę.",
        ],
      },
      {
        type: "quote",
        text: "Rynek często zbiera płynność zanim wykona właściwy ruch.",
      },
      {
        type: "cta",
        text: "Znajdź 3 przykłady liquidity sweep na wykresie.",
      },
    ],
  },

  "m8-l4-stop-hunt": {
    blocks: [
      { type: "h2", text: "Stop Hunt" },
      {
        type: "p",
        text: "Stop hunt to sytuacja, w której rynek celowo wybija poziomy, gdzie znajdują się stop lossy traderów, aby zebrać płynność potrzebną dużym uczestnikom rynku.",
      },
      {
        type: "bullets",
        items: [
          "Rynek wybija poziom stop lossów.",
          "Traderzy zostają wyrzuceni z pozycji.",
          "Po tym często pojawia się właściwy ruch ceny.",
        ],
      },
      {
        type: "quote",
        text: "Stop hunt jest częścią mechaniki rynku, nie manipulacją.",
      },
      {
        type: "cta",
        text: "Znajdź 5 miejsc gdzie rynek zrobił stop hunt.",
      },
    ],
  },

  "m8-l5-equal-highs-lows": {
    blocks: [
      { type: "h2", text: "Equal Highs i Equal Lows" },
      {
        type: "p",
        text: "Equal highs i equal lows to miejsca gdzie wiele świec tworzy podobny poziom. Traderzy często ustawiają tam stop lossy, dlatego są to ważne strefy płynności.",
      },
      {
        type: "bullets",
        items: [
          "Equal highs przyciągają płynność nad poziom.",
          "Equal lows przyciągają płynność pod poziom.",
          "Rynek często najpierw zbiera tę płynność.",
        ],
      },
      {
        type: "quote",
        text: "Gdzie wielu traderów widzi poziom, tam często znajduje się płynność.",
      },
      {
        type: "cta",
        text: "Znajdź na wykresie 5 przykładów equal highs i equal lows.",
      },
    ],
  },

  "m8-l6-liquidity-w-praktyce": {
    blocks: [
      { type: "h2", text: "Liquidity w praktyce" },
      {
        type: "p",
        text: "Zrozumienie płynności pomaga traderowi przewidywać gdzie rynek może się poruszyć zanim zacznie właściwy ruch.",
      },
      {
        type: "checklist",
        items: [
          { text: "Wiem gdzie znajdują się stop lossy." },
          { text: "Rozumiem gdzie jest liquidity." },
          { text: "Nie wchodzę w trade bez kontekstu liquidity." },
        ],
      },
      {
        type: "quote",
        text: "Liquidity często wyznacza kierunek następnego ruchu rynku.",
      },
      {
        type: "cta",
        text: "Przeanalizuj 10 wykresów i zaznacz miejsca liquidity.",
      },
    ],
  },

  // =========================
  // MODUŁ 9 — RISK MANAGEMENT
  // =========================
  "m9-l1-co-to-jest-risk-management": {
    blocks: [
      { type: "h2", text: "Co to jest risk management?" },
      {
        type: "p",
        text: "Risk management to zestaw zasad, które określają ile ryzykujesz, jak chronisz konto i jak reagujesz na serię strat. To fundament profesjonalnego tradingu.",
      },
      {
        type: "bullets",
        items: [
          "Risk management chroni kapitał.",
          "Pozwala przetrwać gorsze serie trade.",
          "Oddziela profesjonalne działanie od impulsywnej gry.",
          "Bez risk managementu nawet dobry setup może zniszczyć konto.",
        ],
      },
      {
        type: "quote",
        text: "Najpierw przetrwanie. Dopiero potem rozwój konta.",
      },
      {
        type: "cta",
        text: "Napisz własnymi słowami, dlaczego risk management jest ważniejszy niż pojedynczy trade.",
      },
    ],
  },

  "m9-l2-zarzadzanie-pozycja": {
    blocks: [
      { type: "h2", text: "Co to jest zarządzanie pozycją?" },
      {
        type: "p",
        text: "Zarządzanie pozycją to sposób prowadzenia trade po jego otwarciu. Obejmuje decyzje dotyczące stop lossa, take profitu oraz reakcji na zmieniające się warunki rynku.",
      },
      {
        type: "bullets",
        items: [
          "Decyzje po wejściu są tak samo ważne jak samo wejście.",
          "Każdy trade powinien mieć plan zarządzania.",
          "Brak zasad prowadzi do emocjonalnych decyzji.",
        ],
      },
      {
        type: "quote",
        text: "Dobry trade można zniszczyć złym zarządzaniem.",
      },
      {
        type: "cta",
        text: "Opisz, co robisz z trade po jego otwarciu.",
      },
    ],
  },

  "m9-l3-wielkosc-pozycji": {
    blocks: [
      { type: "h2", text: "Wielkość pozycji" },
      {
        type: "p",
        text: "Wielkość pozycji musi wynikać z ryzyka, a nie z tego ile chcesz zarobić. To jedna z podstawowych zasad profesjonalnego tradingu.",
      },
      {
        type: "bullets",
        items: [
          "Najpierw określasz ile ryzykujesz.",
          "Potem liczysz gdzie jest Stop Loss.",
          "Dopiero na końcu dobierasz wielkość pozycji.",
          "Wielkość pozycji nie może być losowa.",
        ],
      },
      {
        type: "quote",
        text: "Trader nie zaczyna od lota. Trader zaczyna od ryzyka.",
      },
      {
        type: "checklist",
        items: [
          { text: "Nie ustawiam pozycji na oko." },
          { text: "Najpierw liczę ryzyko." },
          { text: "Dopiero potem dobieram wielkość pozycji." },
        ],
      },
      {
        type: "cta",
        text: "Sprawdź na demo jak zmienia się wielkość pozycji przy różnych Stop Lossach.",
      },
    ],
  },

  "m9-l4-ile-ryzykowac": {
    blocks: [
      { type: "h2", text: "Ile ryzykować na trade?" },
      {
        type: "p",
        text: "Początkujący trader powinien ryzykować mało. Celem nie jest szybki zysk, tylko zbudowanie stabilności i odporności na serię strat.",
      },
      {
        type: "bullets",
        items: [
          "Zbyt duży risk zwiększa presję psychiczną.",
          "Zbyt duży risk szybciej niszczy konto.",
          "Mniejszy risk pomaga egzekwować plan.",
          "Stabilność jest ważniejsza niż agresja.",
        ],
      },
      {
        type: "quote",
        text: "Za duży risk nie przyspiesza rozwoju. Najczęściej tylko przyspiesza błędy.",
      },
      {
        type: "cta",
        text: "Ustal własny limit ryzyka na jeden trade i na cały dzień.",
      },
    ],
  },

  "m9-l5-zarzadzanie-seria-strat": {
    blocks: [
      { type: "h2", text: "Zarządzanie serią strat" },
      {
        type: "p",
        text: "Seria strat jest normalną częścią tradingu. Problemem nie jest sama seria, tylko brak zasad działania w takim okresie.",
      },
      {
        type: "bullets",
        items: [
          "Każdy system ma gorsze okresy.",
          "Po serii strat łatwo wejść w revenge trading.",
          "Dobrze ustawione limity pomagają zachować kontrolę.",
          "Po kilku stratach warto zmniejszyć tempo i wrócić do procesu.",
        ],
      },
      {
        type: "quote",
        text: "Nie seria strat niszczy konto. Konto niszczy to, co robisz po serii strat.",
      },
      {
        type: "checklist",
        items: [
          { text: "Mam limit strat dziennych." },
          { text: "Wiem kiedy kończę handel na dany dzień." },
          { text: "Nie próbuję odrabiać strat impulsywnie." },
        ],
      },
      {
        type: "cta",
        text: "Zapisz plan działania po 3 stratach z rzędu.",
      },
    ],
  },

  "m9-l6-jak-chronic-konto": {
    blocks: [
      { type: "h2", text: "Jak chronić konto?" },
      {
        type: "p",
        text: "Ochrona konta to fundament długoterminowego tradingu. Bez kapitału nie możesz egzekwować przewagi, nawet jeśli masz dobry system.",
      },
      {
        type: "bullets",
        items: [
          "Używaj Stop Lossa.",
          "Ryzykuj stały, mały procent konta.",
          "Miej limit dzienny i tygodniowy.",
          "Unikaj zwiększania pozycji po stracie z emocji.",
        ],
      },
      {
        type: "quote",
        text: "Kapitał to amunicja tradera. Kto nie chroni kapitału, wypada z gry.",
      },
      {
        type: "checklist",
        items: [
          { text: "Mam zasady ochrony kapitału." },
          { text: "Nie ryzykuję impulsywnie." },
          { text: "Traktuję konto jak narzędzie pracy." },
        ],
      },
      {
        type: "cta",
        text: "Stwórz własne 5 zasad ochrony konta tradingowego.",
      },
    ],
  },

  // =========================
  // MODUŁ 10 — ZARZĄDZANIE POZYCJĄ
  // =========================
  "m10-l1-zarzadzanie-trade": {
    blocks: [
      { type: "h2", text: "Zarządzanie trade" },
      {
        type: "p",
        text: "Zarządzanie trade zaczyna się po wejściu w pozycję. To moment, w którym trader musi działać według planu, a nie według emocji.",
      },
      {
        type: "bullets",
        items: [
          "Wejście to dopiero początek trade.",
          "Musisz wiedzieć co robisz, gdy cena idzie w Twoją stronę.",
          "Musisz wiedzieć co robisz, gdy cena zaczyna się cofać.",
          "Brak planu zarządzania prowadzi do chaosu.",
        ],
      },
      {
        type: "quote",
        text: "Dobry setup można zepsuć złym zarządzaniem.",
      },
      {
        type: "checklist",
        items: [
          { text: "Mam plan po wejściu w pozycję." },
          { text: "Nie przesuwam poziomów impulsywnie." },
          { text: "Rozumiem, że zarządzanie jest częścią edge." },
        ],
      },
      {
        type: "cta",
        text: "Opisz jak wygląda Twój plan zarządzania trade od wejścia do wyjścia.",
      },
    ],
  },

  "m10-l2-partial-tp": {
    blocks: [
      { type: "h2", text: "Partial TP" },
      {
        type: "p",
        text: "Partial TP polega na częściowym zamknięciu pozycji przed osiągnięciem pełnego targetu. Dzięki temu możesz zabezpieczyć część zysku i jednocześnie zostawić część pozycji na dalszy ruch.",
      },
      {
        type: "bullets",
        items: [
          "Zmniejsza presję psychiczną.",
          "Pozwala zabezpieczyć część wyniku.",
          "Daje większą elastyczność zarządzania pozycją.",
          "Musi być zgodny z planem, a nie ze strachem.",
        ],
      },
      {
        type: "quote",
        text: "Częściowe zamknięcie ma sens tylko wtedy, gdy jest częścią systemu.",
      },
      {
        type: "cta",
        text: "Rozpisz przykładowy trade z partial TP: wejście, pierwszy target i końcowe wyjście.",
      },
    ],
  },

  "m10-l3-trailing-stop": {
    blocks: [
      { type: "h2", text: "Trailing stop" },
      {
        type: "p",
        text: "Trailing stop to przesuwanie Stop Lossa wraz z ruchem ceny, aby zabezpieczać coraz większy zysk. To narzędzie pomaga utrzymać pozycję dłużej bez oddawania całego ruchu.",
      },
      {
        type: "bullets",
        items: [
          "Chroni rosnący zysk.",
          "Może być oparty o strukturę rynku.",
          "Nie powinien być przesuwany zbyt ciasno.",
          "Zbyt agresywny trailing może wyrzucać z dobrych trade.",
        ],
      },
      {
        type: "quote",
        text: "Trailing stop ma chronić zysk, a nie zabijać trade zbyt wcześnie.",
      },
      {
        type: "cta",
        text: "Znajdź na wykresie trend i zaznacz 3 logiczne miejsca przesunięcia trailing stopa.",
      },
    ],
  },

  "m10-l4-scaling-pozycji": {
    blocks: [
      { type: "h2", text: "Scaling pozycji" },
      {
        type: "p",
        text: "Scaling pozycji oznacza dokładanie części pozycji lub budowanie wejścia etapami. To bardziej zaawansowana technika, która wymaga dużej dyscypliny i jasnych zasad.",
      },
      {
        type: "bullets",
        items: [
          "Nie dokładaj pozycji z emocji.",
          "Scaling musi wynikać z planu.",
          "Każde dokładanie zwiększa ekspozycję na ryzyko.",
          "Brak kontroli nad scalingiem szybko psuje risk management.",
        ],
      },
      {
        type: "quote",
        text: "Dokładanie do pozycji bez planu nie jest strategią. To hazard.",
      },
      {
        type: "cta",
        text: "Napisz kiedy dokładanie do pozycji ma sens, a kiedy staje się błędem.",
      },
    ],
  },

  "m10-l5-kiedy-zamknac-trade": {
    blocks: [
      { type: "h2", text: "Kiedy zamknąć trade" },
      {
        type: "p",
        text: "Wyjście z trade powinno wynikać z planu, nie z chwilowego strachu lub chciwości. Musisz wiedzieć kiedy kończy się sens trzymania pozycji.",
      },
      {
        type: "bullets",
        items: [
          "Zamknięcie może wynikać z osiągnięcia targetu.",
          "Może wynikać z zanegowania scenariusza.",
          "Może wynikać z planowanego zarządzania pozycją.",
          "Nie zamykaj pozycji tylko dlatego, że boisz się oddać część zysku.",
        ],
      },
      {
        type: "quote",
        text: "Wyjście powinno być decyzją z planu, nie reakcją z emocji.",
      },
      {
        type: "cta",
        text: "Przeanalizuj 3 ostatnie trade i oceń, czy wyjście było zgodne z planem.",
      },
    ],
  },

  "m10-l6-zarzadzanie-wygrana": {
    blocks: [
      { type: "h2", text: "Zarządzanie wygraną" },
      {
        type: "p",
        text: "Wygrany trade też trzeba umieć prowadzić. Wielu traderów dobrze wchodzi, ale zbyt szybko zamyka zysk lub oddaje go przez brak zasad.",
      },
      {
        type: "bullets",
        items: [
          "Nie zamykaj zysku tylko dlatego, że widzisz plus.",
          "Pozwalaj dobrym trade oddychać.",
          "Miej zasady realizacji zysku.",
          "Prowadzenie wygranej pozycji to element przewagi.",
        ],
      },
      {
        type: "checklist",
        items: [
          { text: "Mam plan realizacji zysku." },
          { text: "Nie oddaję całego ruchu przez chaos." },
          { text: "Nie uciekam z pozycji tylko ze strachu." },
        ],
      },
      {
        type: "quote",
        text: "Dobry trader nie tylko umie wejść. Dobry trader umie utrzymać dobrą pozycję.",
      },
      {
        type: "cta",
        text: "Rozpisz swoje zasady zarządzania wygranym trade w 5 punktach.",
      },
    ],
  },

  // =========================
  // MODUŁ 11 — PSYCHOLOGIA TRADINGU
  // =========================
  "m11-l1-emocje-w-tradingu": {
    blocks: [
      { type: "h2", text: "Emocje w tradingu" },
      {
        type: "p",
        text: "Trading to nie tylko analiza rynku. To także zarządzanie własnymi emocjami. Nawet dobry system traci wartość, jeśli trader nie potrafi nad sobą panować.",
      },
      {
        type: "bullets",
        items: [
          "Strach wpływa na wejścia i wyjścia.",
          "Chciwość powoduje przeciąganie pozycji.",
          "Frustracja psuje jakość decyzji.",
          "Emocje nie znikną, ale można nauczyć się nimi zarządzać.",
        ],
      },
      {
        type: "quote",
        text: "Największym przeciwnikiem tradera często nie jest rynek. Jest nim własna głowa.",
      },
      {
        type: "cta",
        text: "Zapisz 3 emocje, które najczęściej pojawiają się u Ciebie podczas tradingu.",
      },
    ],
  },

  "m11-l2-fomo": {
    blocks: [
      { type: "h2", text: "FOMO" },
      {
        type: "p",
        text: "FOMO to strach przed przegapieniem ruchu. Trader widzi, że rynek rusza i wchodzi bez planu, bo boi się, że 'ucieknie mu okazja'.",
      },
      {
        type: "bullets",
        items: [
          "FOMO prowadzi do spóźnionych wejść.",
          "FOMO powoduje gonienie świec.",
          "FOMO osłabia dyscyplinę.",
          "FOMO wynika z braku cierpliwości i zaufania do procesu.",
        ],
      },
      {
        type: "quote",
        text: "Nie każdy ruch jest dla Ciebie. Rynek nie kończy się dzisiaj.",
      },
      {
        type: "checklist",
        items: [
          { text: "Nie wchodzę tylko dlatego, że rynek już ruszył." },
          { text: "Czekam na warunki zgodne z planem." },
          { text: "Akceptuję, że część ruchów mnie ominie." },
        ],
      },
      {
        type: "cta",
        text: "Znajdź 3 przykłady FOMO ze swojej historii i opisz, co powinieneś był zrobić zamiast tego.",
      },
    ],
  },

  "m11-l3-revenge-trading": {
    blocks: [
      { type: "h2", text: "Revenge trading" },
      {
        type: "p",
        text: "Revenge trading to próba szybkiego odrobienia straty przez impulsywne wejścia. To jeden z najdroższych błędów psychologicznych w tradingu.",
      },
      {
        type: "bullets",
        items: [
          "Pojawia się po stracie lub serii strat.",
          "Trader chce 'odzyskać' pieniądze natychmiast.",
          "Analiza schodzi na drugi plan.",
          "Risk często rośnie razem z emocjami.",
        ],
      },
      {
        type: "quote",
        text: "Rynek nie wie, że chcesz odzyskać pieniądze. I nic go to nie obchodzi.",
      },
      {
        type: "cta",
        text: "Napisz swój plan zachowania po stracie, żeby ograniczyć revenge trading.",
      },
    ],
  },

  "m11-l4-overtrading": {
    blocks: [
      { type: "h2", text: "Overtrading" },
      {
        type: "p",
        text: "Overtrading to zbyt częste wchodzenie w rynek bez jakości. Często wynika z nudy, presji lub chęci ciągłego działania.",
      },
      {
        type: "bullets",
        items: [
          "Więcej trade nie oznacza lepszych wyników.",
          "Overtrading obniża selekcję wejść.",
          "Prowadzi do zmęczenia decyzyjnego.",
          "Zwiększa wpływ emocji i kosztów.",
        ],
      },
      {
        type: "quote",
        text: "Rynek nie płaci za aktywność. Rynek płaci za jakość decyzji.",
      },
      {
        type: "cta",
        text: "Sprawdź ile wejść dziennie robisz i które z nich naprawdę były zgodne z planem.",
      },
    ],
  },

  "m11-l5-strach-przed-strata": {
    blocks: [
      { type: "h2", text: "Strach przed stratą" },
      {
        type: "p",
        text: "Strach przed stratą powoduje zamykanie pozycji zbyt wcześnie, brak wejścia mimo setupu albo chaos w zarządzaniu pozycją.",
      },
      {
        type: "bullets",
        items: [
          "Trader zamyka zysk za szybko.",
          "Trader boi się zaakceptować małą stratę.",
          "Trader unika wejścia mimo przewagi.",
          "Strach często wynika z za dużego ryzyka.",
        ],
      },
      {
        type: "quote",
        text: "Mała strata zaakceptowana zgodnie z planem jest częścią profesjonalnego tradingu.",
      },
      {
        type: "cta",
        text: "Zastanów się, czy Twój strach przed stratą nie wynika z za dużego risku na trade.",
      },
    ],
  },

  "m11-l6-proces-vs-wynik": {
    blocks: [
      { type: "h2", text: "Proces vs wynik" },
      {
        type: "p",
        text: "Trader powinien oceniać siebie głównie po jakości procesu, a nie po wyniku pojedynczego trade. Wynik jednej pozycji niczego jeszcze nie udowadnia.",
      },
      {
        type: "bullets",
        items: [
          "Dobry trade może zakończyć się stratą.",
          "Zły trade może zakończyć się zyskiem.",
          "Proces buduje przewagę długoterminowo.",
          "Ocena po pojedynczym wyniku prowadzi do chaosu.",
        ],
      },
      {
        type: "quote",
        text: "Nie pytaj po jednym trade: ile zarobiłem. Pytaj: czy wykonałem plan?",
      },
      {
        type: "checklist",
        items: [
          { text: "Oceniam jakość wykonania, nie tylko wynik." },
          { text: "Nie zmieniam systemu po jednym trade." },
          { text: "Myślę w serii, nie w pojedynczej pozycji." },
        ],
      },
      {
        type: "cta",
        text: "Weź ostatnie 5 trade i oceń je pod kątem procesu, a nie wyniku finansowego.",
      },
    ],
  },

  // =========================
  // MODUŁ 12 — RUTYNA TRADERA
  // =========================
  "m12-l1-plan-dnia-tradera": {
    blocks: [
      { type: "h2", text: "Plan dnia tradera" },
      {
        type: "p",
        text: "Dobrze ułożony plan dnia pomaga wejść w sesję spokojnie i z większą koncentracją. Profesjonalny trading nie zaczyna się od klikania, tylko od przygotowania.",
      },
      {
        type: "bullets",
        items: [
          "Stała rutyna zmniejsza chaos decyzyjny.",
          "Plan dnia pomaga ograniczyć impulsywność.",
          "Trader powinien wiedzieć kiedy analizuje, kiedy handluje i kiedy kończy pracę.",
          "Brak planu dnia zwiększa zmęczenie i przypadkowość decyzji.",
        ],
      },
      {
        type: "quote",
        text: "Im mniej chaosu przed sesją, tym mniej chaosu w trakcie sesji.",
      },
      {
        type: "cta",
        text: "Rozpisz swój własny plan dnia tradingowego od przygotowania do zakończenia sesji.",
      },
    ],
  },

  "m12-l2-analiza-przed-sesja": {
    blocks: [
      { type: "h2", text: "Analiza rynku przed sesją" },
      {
        type: "p",
        text: "Analiza przed sesją pozwala wejść w rynek z gotowym scenariuszem. Dzięki temu nie reagujesz chaotycznie na każdy ruch ceny.",
      },
      {
        type: "bullets",
        items: [
          "Sprawdź strukturę rynku.",
          "Określ bias i scenariusze.",
          "Zaznacz poziomy reakcji.",
          "Sprawdź, czy są ważne wydarzenia makro.",
        ],
      },
      {
        type: "quote",
        text: "Najlepsze trade są często przygotowane wcześniej, zanim rynek da wejście.",
      },
      {
        type: "cta",
        text: "Przygotuj analizę jednego rynku przed następną sesją i rozpisz 2 możliwe scenariusze.",
      },
    ],
  },

  "m12-l3-przygotowanie-do-tradingu": {
    blocks: [
      { type: "h2", text: "Przygotowanie do tradingu" },
      {
        type: "p",
        text: "Przygotowanie do sesji to nie tylko analiza wykresu. To także przygotowanie mentalne, techniczne i organizacyjne.",
      },
      {
        type: "bullets",
        items: [
          "Sprawdź platformę i ustawienia.",
          "Usuń rozpraszacze.",
          "Wejdź na rynek z jasnym planem.",
          "Nie zaczynaj sesji w pośpiechu.",
        ],
      },
      {
        type: "quote",
        text: "Słabe przygotowanie przed sesją często mści się w trakcie sesji.",
      },
      {
        type: "checklist",
        items: [
          { text: "Mam przygotowany wykres." },
          { text: "Mam ustalony plan." },
          { text: "Jestem spokojny i skupiony przed sesją." },
        ],
      },
      {
        type: "cta",
        text: "Stwórz checklistę przygotowania do tradingu i użyj jej przez 5 kolejnych sesji.",
      },
    ],
  },

  "m12-l4-rutyna-tradingowa": {
    blocks: [
      { type: "h2", text: "Rutyna tradingowa" },
      {
        type: "p",
        text: "Rutyna tradingowa to powtarzalny sposób działania, który pomaga zachować spójność. Dzięki niej trader działa bardziej jak operator procesu niż jak ktoś reagujący na emocje.",
      },
      {
        type: "bullets",
        items: [
          "Rutyna porządkuje dzień pracy.",
          "Zmniejsza wpływ przypadku i impulsywności.",
          "Pomaga utrzymać koncentrację.",
          "Ułatwia ocenę jakości wykonania planu.",
        ],
      },
      {
        type: "quote",
        text: "Powtarzalność buduje profesjonalizm.",
      },
      {
        type: "cta",
        text: "Opisz swoją idealną rutynę tradingową przed, w trakcie i po sesji.",
      },
    ],
  },

  "m12-l5-analiza-po-sesji": {
    blocks: [
      { type: "h2", text: "Analiza po sesji" },
      {
        type: "p",
        text: "Po zakończonej sesji trader powinien przejrzeć swoje decyzje i sprawdzić, czy działał zgodnie z planem. To ważny element rozwoju i budowania dyscypliny.",
      },
      {
        type: "bullets",
        items: [
          "Sprawdź jakość wejść.",
          "Sprawdź zarządzanie pozycją.",
          "Sprawdź czy emocje wpłynęły na decyzje.",
          "Wyciągnij 1–2 konkretne wnioski na kolejną sesję.",
        ],
      },
      {
        type: "quote",
        text: "Sesja kończy się nie wtedy, gdy zamkniesz wykres. Sesja kończy się wtedy, gdy wyciągniesz wnioski.",
      },
      {
        type: "cta",
        text: "Po najbliższej sesji zrób krótkie podsumowanie: co zrobiłeś dobrze i co poprawisz jutro.",
      },
    ],
  },

  "m12-l6-dyscyplina": {
    blocks: [
      { type: "h2", text: "Dyscyplina" },
      {
        type: "p",
        text: "Dyscyplina to zdolność wykonywania planu niezależnie od emocji. To jeden z najważniejszych fundamentów stabilnego tradingu.",
      },
      {
        type: "bullets",
        items: [
          "Dyscyplina nie oznacza perfekcji, tylko konsekwencję.",
          "Buduje zaufanie do własnego procesu.",
          "Chroni przed impulsami i chaosem.",
          "Sprawia, że wyniki stają się bardziej powtarzalne.",
        ],
      },
      {
        type: "quote",
        text: "Dyscyplina jest mostem między planem a wynikiem.",
      },
      {
        type: "checklist",
        items: [
          { text: "Mam zasady i potrafię się ich trzymać." },
          { text: "Nie zmieniam planu pod wpływem emocji." },
          { text: "Oceniam siebie po konsekwencji działania." },
        ],
      },
      {
        type: "cta",
        text: "Wybierz jedną zasadę tradingową, której będziesz pilnować szczególnie mocno przez najbliższy tydzień.",
      },
    ],
  },

  // =========================
  // MODUŁ 13 — TRADING JOURNAL
  // =========================
  "m13-l1-dlaczego-journal-jest-wazny": {
    blocks: [
      { type: "h2", text: "Dlaczego journal jest ważny" },
      {
        type: "p",
        text: "Trading journal pomaga zauważyć wzorce, błędy i mocne strony Twojego procesu. Bez journalu trader często działa w oparciu o pamięć i emocje, a nie o fakty.",
      },
      {
        type: "bullets",
        items: [
          "Pozwala oceniać proces obiektywnie.",
          "Pomaga znaleźć powtarzające się błędy.",
          "Buduje samoświadomość tradera.",
          "Tworzy bazę do rozwoju systemu.",
        ],
      },
      {
        type: "quote",
        text: "To, czego nie zapisujesz, trudniej zrozumieć i poprawić.",
      },
      {
        type: "cta",
        text: "Napisz 3 powody, dla których prowadzenie journalu może poprawić Twój trading.",
      },
    ],
  },

  "m13-l2-jak-prowadzic-journal": {
    blocks: [
      { type: "h2", text: "Jak prowadzić trading journal" },
      {
        type: "p",
        text: "Journal powinien być prosty, regularny i użyteczny. Nie chodzi o ilość notatek, tylko o jakość informacji, które naprawdę pomagają podejmować lepsze decyzje.",
      },
      {
        type: "bullets",
        items: [
          "Zapisuj dane trade i kontekst wejścia.",
          "Dodawaj screeny wykresu.",
          "Opisuj emocje i błędy.",
          "Regularnie wracaj do wpisów i wyciągaj wnioski.",
        ],
      },
      {
        type: "quote",
        text: "Journal ma pomagać w decyzjach, a nie być sztuką dla sztuki.",
      },
      {
        type: "cta",
        text: "Stwórz własny szablon wpisu do journalu i użyj go przy kolejnych 3 trade.",
      },
    ],
  },

  "m13-l3-co-zapisywac": {
    blocks: [
      { type: "h2", text: "Co zapisywać w journal" },
      {
        type: "p",
        text: "Dobry journal zawiera nie tylko wynik finansowy, ale też szczegóły procesu: setup, kontekst, emocje i jakość wykonania planu.",
      },
      {
        type: "bullets",
        items: [
          "Data i godzina wejścia.",
          "Instrument i timeframe.",
          "Bias i setup.",
          "Stop Loss, Take Profit i wynik.",
          "Emocje przed i po trade.",
        ],
      },
      {
        type: "quote",
        text: "Wynik mówi co się stało. Journal pomaga zrozumieć dlaczego.",
      },
      {
        type: "cta",
        text: "Zapisz przykładowy wpis do journalu dla swojego ostatniego trade.",
      },
    ],
  },

  "m13-l4-analiza-trade": {
    blocks: [
      { type: "h2", text: "Analiza trade" },
      {
        type: "p",
        text: "Analiza trade polega na ocenie jakości decyzji, a nie tylko wyniku. Dobry trade może skończyć się stratą, jeśli rynek po prostu nie zagrał scenariusza.",
      },
      {
        type: "bullets",
        items: [
          "Oceń jakość wejścia.",
          "Oceń jakość zarządzania pozycją.",
          "Oddziel wynik od procesu.",
          "Szukaj faktów, a nie wymówek.",
        ],
      },
      {
        type: "quote",
        text: "Profesjonalny trader analizuje wykonanie, nie tylko rezultat.",
      },
      {
        type: "cta",
        text: "Przeanalizuj ostatni trade i oceń go w 3 kategoriach: wejście, zarządzanie, emocje.",
      },
    ],
  },

  "m13-l5-poprawa-wynikow": {
    blocks: [
      { type: "h2", text: "Poprawa wyników" },
      {
        type: "p",
        text: "Wyniki poprawiają się wtedy, gdy poprawiasz proces. Journal pomaga zidentyfikować co działa, a co powtarzalnie obniża Twoją skuteczność.",
      },
      {
        type: "bullets",
        items: [
          "Najpierw znajdź główny problem.",
          "Wprowadź jedną konkretną poprawkę.",
          "Testuj ją przez serię trade.",
          "Mierz czy naprawdę daje efekt.",
        ],
      },
      {
        type: "quote",
        text: "Poprawa nie bierze się z motywacji. Poprawa bierze się z danych i konsekwencji.",
      },
      {
        type: "cta",
        text: "Wypisz jedną rzecz, którą poprawisz w swoim tradingu na podstawie journalu.",
      },
    ],
  },

  "m13-l6-budowanie-statystyk": {
    blocks: [
      { type: "h2", text: "Budowanie statystyk" },
      {
        type: "p",
        text: "Journal pozwala budować statystyki, które pokazują czy Twój system naprawdę ma przewagę. Bez liczb łatwo opierać się na złudzeniach.",
      },
      {
        type: "bullets",
        items: [
          "Śledź win rate.",
          "Śledź średnie RR.",
          "Notuj najlepsze i najgorsze setupy.",
          "Szukaj powtarzalnych wzorców w wynikach.",
        ],
      },
      {
        type: "checklist",
        items: [
          { text: "Zbieram dane o swoich trade." },
          { text: "Potrafię ocenić wyniki na większej próbce." },
          { text: "Używam statystyk do poprawy procesu." },
        ],
      },
      {
        type: "quote",
        text: "Statystyka zamienia doświadczenie w przewagę.",
      },
      {
        type: "cta",
        text: "Wybierz 3 statystyki, które zaczniesz śledzić regularnie od dziś.",
      },
    ],
  },

  // =========================
  // MODUŁ 14 — CASE STUDY
  // =========================
  "m14-l1-analiza-realnego-trade": {
    blocks: [
      { type: "h2", text: "Analiza realnego trade" },
      {
        type: "p",
        text: "Case study realnego trade pozwala zobaczyć cały proces w praktyce: od kontekstu, przez wejście, aż po zarządzanie i wynik.",
      },
      {
        type: "bullets",
        items: [
          "Najpierw opisz kontekst rynku.",
          "Potem zaznacz setup i trigger wejścia.",
          "Następnie oceń zarządzanie pozycją.",
          "Na końcu wyciągnij wnioski.",
        ],
      },
      {
        type: "quote",
        text: "Najlepsza nauka to analiza własnych decyzji na realnych przykładach.",
      },
      {
        type: "cta",
        text: "Weź jeden własny trade i opisz go w formie case study od początku do końca.",
      },
    ],
  },

  "m14-l2-analiza-sesji-tradingowej": {
    blocks: [
      { type: "h2", text: "Analiza sesji tradingowej" },
      {
        type: "p",
        text: "Analiza całej sesji pokazuje nie tylko pojedynczy trade, ale cały proces decyzyjny w danym dniu. To pomaga zobaczyć szerszy obraz.",
      },
      {
        type: "bullets",
        items: [
          "Sprawdź jakość przygotowania do sesji.",
          "Oceń selekcję wejść.",
          "Zobacz czy trzymałeś się planu.",
          "Sprawdź jak wyglądała Twoja psychologia w trakcie dnia.",
        ],
      },
      {
        type: "quote",
        text: "Jedna sesja często mówi więcej o traderze niż jeden pojedynczy trade.",
      },
      {
        type: "cta",
        text: "Zrób analizę ostatniej sesji i wypisz 3 mocne strony oraz 3 obszary do poprawy.",
      },
    ],
  },

  "m14-l3-trade-krok-po-kroku": {
    blocks: [
      { type: "h2", text: "Trade krok po kroku" },
      {
        type: "p",
        text: "Rozpisanie trade krok po kroku pomaga zobaczyć, gdzie decyzja była dobra, a gdzie pojawił się błąd lub emocjonalny skrót.",
      },
      {
        type: "bullets",
        items: [
          "Krok 1: kontekst i bias.",
          "Krok 2: setup i miejsce reakcji.",
          "Krok 3: trigger wejścia.",
          "Krok 4: zarządzanie pozycją.",
          "Krok 5: wyjście i wnioski.",
        ],
      },
      {
        type: "quote",
        text: "To co rozpisane, staje się zrozumiałe. To co tylko pamiętane, łatwo się zniekształca.",
      },
      {
        type: "cta",
        text: "Rozpisz ostatni trade dokładnie w 5 krokach.",
      },
    ],
  },

  "m14-l4-bledy-w-trade": {
    blocks: [
      { type: "h2", text: "Błędy w trade" },
      {
        type: "p",
        text: "Każdy trade może zawierać błąd techniczny, psychologiczny albo organizacyjny. Kluczowe jest umieć go nazwać i zrozumieć.",
      },
      {
        type: "bullets",
        items: [
          "Błąd wejścia.",
          "Błąd w risk management.",
          "Błąd w zarządzaniu pozycją.",
          "Błąd wynikający z emocji.",
        ],
      },
      {
        type: "quote",
        text: "Błąd nazwany jest łatwiejszy do poprawienia niż błąd ignorowany.",
      },
      {
        type: "cta",
        text: "Wybierz jeden trade i określ, jaki był w nim największy błąd.",
      },
    ],
  },

  "m14-l5-poprawna-analiza": {
    blocks: [
      { type: "h2", text: "Poprawna analiza" },
      {
        type: "p",
        text: "Poprawna analiza jest konkretna, spokojna i oparta na faktach. Nie chodzi o usprawiedliwianie wyniku, ale o uczciwe zobaczenie rzeczywistości.",
      },
      {
        type: "bullets",
        items: [
          "Oddziel fakty od emocji.",
          "Nie dopisuj historii po fakcie.",
          "Oceń jakość procesu, nie tylko rezultat.",
          "Zapisz konkretny wniosek na przyszłość.",
        ],
      },
      {
        type: "quote",
        text: "Dobra analiza nie broni ego. Dobra analiza poprawia proces.",
      },
      {
        type: "cta",
        text: "Przeanalizuj jeden trade tak, jakbyś tłumaczył go innemu traderowi krok po kroku.",
      },
    ],
  },

  "m14-l6-wnioski-z-trade": {
    blocks: [
      { type: "h2", text: "Wnioski z trade" },
      {
        type: "p",
        text: "Najważniejszą częścią case study są wnioski. To one zmieniają doświadczenie w realną poprawę działania.",
      },
      {
        type: "bullets",
        items: [
          "Wniosek powinien być konkretny.",
          "Wniosek powinien prowadzić do działania.",
          "Nie zapisuj ogólników typu 'muszę być lepszy'.",
          "Najlepsze wnioski można wdrożyć już przy kolejnej sesji.",
        ],
      },
      {
        type: "checklist",
        items: [
          { text: "Potrafię zapisać konkretny wniosek." },
          { text: "Potrafię połączyć błąd z poprawką." },
          { text: "Wdrażam wnioski w kolejnych sesjach." },
        ],
      },
      {
        type: "quote",
        text: "Trade bez wniosku to stracona lekcja.",
      },
      {
        type: "cta",
        text: "Po ostatnim trade zapisz jeden wniosek, który realnie zmieni Twoje działanie przy następnym setupie.",
      },
    ],
  },

  // =========================
  // MODUŁ 15 — SYSTEM TRADINGOWY
  // =========================
  "m15-l1-czym-jest-system": {
    blocks: [
      { type: "h2", text: "Czym jest system tradingowy" },
      {
        type: "p",
        text: "System tradingowy to zestaw zasad, który określa kiedy wchodzisz, kiedy nie wchodzisz, jak zarządzasz pozycją i jak kontrolujesz ryzyko.",
      },
      {
        type: "bullets",
        items: [
          "System daje powtarzalność.",
          "System ogranicza chaos decyzyjny.",
          "System pomaga budować przewagę długoterminowo.",
          "Bez systemu trader częściej zgaduje niż działa świadomie.",
        ],
      },
      {
        type: "quote",
        text: "System nie musi być skomplikowany. Musi być jasny i egzekwowalny.",
      },
      {
        type: "cta",
        text: "Napisz własnymi słowami, czym różni się pojedynczy setup od pełnego systemu tradingowego.",
      },
    ],
  },

  "m15-l2-budowanie-strategii": {
    blocks: [
      { type: "h2", text: "Budowanie strategii" },
      {
        type: "p",
        text: "Budowanie strategii polega na połączeniu kontekstu rynku, setupu wejścia, zasad risk management i zarządzania pozycją w jeden spójny model działania.",
      },
      {
        type: "bullets",
        items: [
          "Najpierw wybierz typ rynku i setup.",
          "Potem określ warunki wejścia.",
          "Dodaj zasady wyjścia i zarządzania pozycją.",
          "Na końcu określ jak będziesz to testować i mierzyć.",
        ],
      },
      {
        type: "quote",
        text: "Strategia ma odpowiadać na pytanie: co robię, kiedy i dlaczego.",
      },
      {
        type: "cta",
        text: "Wypisz 4 elementy, które musi zawierać Twoja strategia tradingowa.",
      },
    ],
  },

  "m15-l3-checklist-trade": {
    blocks: [
      { type: "h2", text: "Checklist trade" },
      {
        type: "p",
        text: "Checklist trade to prosty filtr, który pomaga sprawdzić, czy dane wejście naprawdę spełnia warunki systemu.",
      },
      {
        type: "bullets",
        items: [
          "Bias rynku.",
          "Miejsce reakcji.",
          "Setup wejścia.",
          "Potwierdzenie.",
          "Stop Loss i plan wyjścia.",
        ],
      },
      {
        type: "quote",
        text: "Checklist nie gwarantuje zysku. Checklist chroni przed głupimi decyzjami.",
      },
      {
        type: "checklist",
        items: [
          { text: "Mam checklistę wejścia." },
          { text: "Sprawdzam warunki przed kliknięciem." },
          { text: "Nie pomijam zasad pod wpływem emocji." },
        ],
      },
      {
        type: "cta",
        text: "Stwórz swoją checklistę trade w 5 krótkich punktach.",
      },
    ],
  },

  "m15-l4-plan-tradingowy": {
    blocks: [
      { type: "h2", text: "Plan tradingowy" },
      {
        type: "p",
        text: "Plan tradingowy to dokument, który opisuje jak działasz jako trader. To mapa Twojego procesu decyzyjnego.",
      },
      {
        type: "bullets",
        items: [
          "Jakie rynki handlujesz.",
          "Jakich setupów szukasz.",
          "Jak zarządzasz ryzykiem.",
          "Kiedy nie handlujesz.",
          "Jak analizujesz wyniki i rozwijasz system.",
        ],
      },
      {
        type: "quote",
        text: "Trader bez planu częściej reaguje niż prowadzi proces.",
      },
      {
        type: "cta",
        text: "Zacznij pisać swój plan tradingowy i zapisz pierwsze 5 zasad.",
      },
    ],
  },

  "m15-l5-edge-tradera": {
    blocks: [
      { type: "h2", text: "Edge tradera" },
      {
        type: "p",
        text: "Edge to Twoja przewaga na rynku. Nie oznacza stuprocentowej skuteczności, tylko powtarzalny proces, który daje dodatnią wartość w serii trade.",
      },
      {
        type: "bullets",
        items: [
          "Edge nie polega na przewidywaniu każdego ruchu.",
          "Edge wynika z jakości setupów i egzekucji.",
          "Edge wymaga próbki danych.",
          "Edge buduje się przez testowanie i konsekwencję.",
        ],
      },
      {
        type: "quote",
        text: "Edge nie musi wygrywać zawsze. Edge musi wygrywać w długim terminie.",
      },
      {
        type: "cta",
        text: "Napisz, co według Ciebie jest Twoją główną przewagą lub co ma nią być w Twoim systemie.",
      },
    ],
  },

  "m15-l6-testowanie-strategii": {
    blocks: [
      { type: "h2", text: "Testowanie strategii" },
      {
        type: "p",
        text: "Strategia wymaga testowania na danych historycznych i w praktyce. Bez testów nie wiesz, czy masz system, czy tylko pomysł.",
      },
      {
        type: "bullets",
        items: [
          "Testuj na większej próbce trade.",
          "Sprawdzaj nie tylko wynik, ale też jakość egzekucji.",
          "Notuj win rate, RR i błędy.",
          "Nie oceniaj strategii po kilku przypadkach.",
        ],
      },
      {
        type: "checklist",
        items: [
          { text: "Testuję system na danych." },
          { text: "Prowadzę notatki z testów." },
          { text: "Wyciągam wnioski i poprawiam zasady." },
        ],
      },
      {
        type: "quote",
        text: "Zaufanie do strategii buduje się na danych, nie na nadziei.",
      },
      {
        type: "cta",
        text: "Przetestuj jeden setup na minimum 20 historycznych przykładach.",
      },
    ],
  },

  // =========================
  // MODUŁ 16 — STATYSTYKA TRADINGOWA
  // =========================
  "m16-l1-win-rate": {
    blocks: [
      { type: "h2", text: "Win rate" },
      {
        type: "p",
        text: "Win rate to procent wygranych trade. To ważna statystyka, ale sama w sobie nie wystarcza do oceny strategii.",
      },
      {
        type: "bullets",
        items: [
          "Wysoki win rate nie gwarantuje zysku.",
          "Niski win rate może być opłacalny przy dobrym RR.",
          "Win rate trzeba analizować razem z innymi statystykami.",
          "Pojedynczy tydzień nie daje pełnego obrazu.",
        ],
      },
      {
        type: "quote",
        text: "Skuteczność bez kontekstu liczb może być myląca.",
      },
      {
        type: "cta",
        text: "Policz swój win rate z ostatnich 20 trade.",
      },
    ],
  },

  "m16-l2-expectancy": {
    blocks: [
      { type: "h2", text: "Expectancy" },
      {
        type: "p",
        text: "Expectancy pokazuje średni oczekiwany wynik jednego trade w dłuższym okresie. To jedna z najważniejszych miar przewagi systemu.",
      },
      {
        type: "bullets",
        items: [
          "Łączy win rate i relację zysku do ryzyka.",
          "Pokazuje wartość serii trade, a nie pojedynczej pozycji.",
          "Pomaga obiektywnie oceniać strategię.",
          "Uczy myślenia w prawdopodobieństwie.",
        ],
      },
      {
        type: "quote",
        text: "Jedna pozycja to tylko zdarzenie. Expectancy pokazuje wartość procesu.",
      },
      {
        type: "cta",
        text: "Zapisz własnymi słowami czym expectancy różni się od win rate.",
      },
    ],
  },

  "m16-l3-edge-w-tradingu": {
    blocks: [
      { type: "h2", text: "Edge w tradingu" },
      {
        type: "p",
        text: "Edge to statystyczna przewaga, która ujawnia się w większej serii trade. Nie jest gwarancją sukcesu w pojedynczym wejściu.",
      },
      {
        type: "bullets",
        items: [
          "Edge musi być testowalny.",
          "Edge wymaga konsekwentnej egzekucji.",
          "Edge ujawnia się na próbce danych.",
          "Edge nie działa bez dyscypliny.",
        ],
      },
      {
        type: "quote",
        text: "Przewaga bez egzekucji jest tylko teorią.",
      },
      {
        type: "cta",
        text: "Napisz, po czym poznasz, że Twój system naprawdę ma edge.",
      },
    ],
  },

  "m16-l4-analiza-wynikow": {
    blocks: [
      { type: "h2", text: "Analiza wyników" },
      {
        type: "p",
        text: "Analiza wyników pozwala odróżnić chwilowe wahania od realnej jakości systemu. Bez analizy łatwo podejmować złe decyzje na podstawie emocji.",
      },
      {
        type: "bullets",
        items: [
          "Analizuj serię trade, nie pojedynczy wynik.",
          "Szukaj wzorców i odchyleń.",
          "Sprawdzaj jakość wykonania planu.",
          "Patrz na dane spokojnie i regularnie.",
        ],
      },
      {
        type: "quote",
        text: "Dane uspokajają tradera bardziej niż domysły.",
      },
      {
        type: "cta",
        text: "Przejrzyj swoje ostatnie wyniki i wypisz 2 rzeczy, które powtarzały się najczęściej.",
      },
    ],
  },

  "m16-l5-backtesting": {
    blocks: [
      { type: "h2", text: "Backtesting" },
      {
        type: "p",
        text: "Backtesting to testowanie strategii na historycznych danych. Pomaga sprawdzić, czy system ma przewagę zanim zaczniesz ufać mu na realnym rynku.",
      },
      {
        type: "bullets",
        items: [
          "Testuj setup na dużej próbce.",
          "Notuj warunki wejścia i wynik.",
          "Nie naciągaj wyników po fakcie.",
          "Szukaj powtarzalności, nie perfekcji.",
        ],
      },
      {
        type: "quote",
        text: "Backtesting nie daje pewności. Daje lepsze podstawy do zaufania systemowi.",
      },
      {
        type: "cta",
        text: "Przetestuj jeden setup na 20–30 historycznych przykładach i zapisz wyniki.",
      },
    ],
  },

  "m16-l6-optymalizacja-strategii": {
    blocks: [
      { type: "h2", text: "Optymalizacja strategii" },
      {
        type: "p",
        text: "Optymalizacja polega na poprawianiu strategii na podstawie danych, a nie na ciągłym zmienianiu wszystkiego po kilku gorszych wynikach.",
      },
      {
        type: "bullets",
        items: [
          "Najpierw znajdź realny problem.",
          "Wprowadzaj małe zmiany.",
          "Testuj każdą zmianę osobno.",
          "Nie rozwalaj całego systemu przez chwilowy gorszy okres.",
        ],
      },
      {
        type: "checklist",
        items: [
          { text: "Wprowadzam zmiany na podstawie danych." },
          { text: "Nie zmieniam wszystkiego naraz." },
          { text: "Potrafię porównać wyniki przed i po zmianie." },
        ],
      },
      {
        type: "quote",
        text: "Dobra optymalizacja wzmacnia system. Zła optymalizacja niszczy spójność.",
      },
      {
        type: "cta",
        text: "Wybierz jedną małą rzecz, którą możesz zoptymalizować w swoim procesie i zaplanuj jak ją zmierzysz.",
      },
    ],
  },

  // =========================
  // MODUŁ 17 — SKALOWANIE KONTA
  // =========================
  "m17-l1-jak-skalowac-konto": {
    blocks: [
      { type: "h2", text: "Jak skalować konto" },
      {
        type: "p",
        text: "Skalowanie konta oznacza stopniowe zwiększanie wielkości pozycji lub zarządzanego kapitału, gdy wyniki stają się stabilne i powtarzalne.",
      },
      {
        type: "bullets",
        items: [
          "Skalowanie powinno być stopniowe.",
          "Najpierw potrzebna jest stabilność wyników.",
          "Nie skaluj konta impulsywnie.",
          "Większa skala wymaga tej samej lub lepszej dyscypliny.",
        ],
      },
      {
        type: "quote",
        text: "Nie skaluje się marzeń. Skaluje się proces, który działa.",
      },
      {
        type: "cta",
        text: "Napisz kiedy według Ciebie trader naprawdę jest gotowy na skalowanie konta.",
      },
    ],
  },

  "m17-l2-zarzadzanie-wiekszym-kapitalem": {
    blocks: [
      { type: "h2", text: "Zarządzanie większym kapitałem" },
      {
        type: "p",
        text: "Większy kapitał zwiększa presję psychiczną i wymaga jeszcze większej kontroli emocji. To samo wejście wygląda inaczej, gdy stawka jest większa.",
      },
      {
        type: "bullets",
        items: [
          "Większe kwoty silniej wpływają na emocje.",
          "Nie każdy trader jest gotowy psychicznie na większe liczby.",
          "System musi być stabilny zanim zwiększysz skalę.",
          "Błędy przy większym kapitale kosztują więcej.",
        ],
      },
      {
        type: "quote",
        text: "Większy kapitał nie naprawia słabego procesu. On go tylko powiększa.",
      },
      {
        type: "cta",
        text: "Zastanów się, co zmieniłoby się w Twojej psychice, gdybyś handlował 5x większym kapitałem.",
      },
    ],
  },

  "m17-l3-trading-w-prop-firmach": {
    blocks: [
      { type: "h2", text: "Trading w prop firmach" },
      {
        type: "p",
        text: "Prop firmy dają traderowi możliwość handlu większym kapitałem przy spełnieniu określonych zasad i limitów ryzyka.",
      },
      {
        type: "bullets",
        items: [
          "Prop firm wymaga dyscypliny i kontroli ryzyka.",
          "Zasady drawdown są bardzo ważne.",
          "Presja psychiczna bywa większa niż na własnym małym koncie.",
          "Nie wystarczy umieć wejść. Trzeba umieć przetrwać ograniczenia.",
        ],
      },
      {
        type: "quote",
        text: "W prop firmie przewagę ma nie ten, kto handluje agresywnie, tylko ten, kto handluje stabilnie.",
      },
      {
        type: "cta",
        text: "Wypisz 3 cechy tradera, które są szczególnie ważne w prop firmach.",
      },
    ],
  },

  "m17-l4-funded-account": {
    blocks: [
      { type: "h2", text: "Funded account" },
      {
        type: "p",
        text: "Funded account to konto, którym handlujesz po przejściu procesu kwalifikacyjnego lub spełnieniu wymagań dostawcy kapitału.",
      },
      {
        type: "bullets",
        items: [
          "Funded account wymaga stabilności, nie spektakularnych ruchów.",
          "Najważniejsze są limity i ich przestrzeganie.",
          "To nadal trading oparty na procesie, nie na presji szybkiego wyniku.",
          "Psychologia ma ogromne znaczenie.",
        ],
      },
      {
        type: "quote",
        text: "Konto finansowane nie zmienia rynku. Zmienia odpowiedzialność tradera.",
      },
      {
        type: "cta",
        text: "Napisz, jakie zasady musiałbyś pilnować bardziej rygorystycznie na funded account.",
      },
    ],
  },

  "m17-l5-zarzadzanie-kapitalem": {
    blocks: [
      { type: "h2", text: "Zarządzanie kapitałem" },
      {
        type: "p",
        text: "Zarządzanie kapitałem to sposób, w jaki chronisz i rozwijasz środki, którymi handlujesz. To szerszy temat niż pojedynczy risk na trade.",
      },
      {
        type: "bullets",
        items: [
          "Liczy się nie tylko wejście, ale też ochrona całego kapitału.",
          "Kapitał powinien rosnąć razem ze stabilnością procesu.",
          "Nie zwiększaj ryzyka tylko dlatego, że miałeś dobry tydzień.",
          "Myśl długoterminowo, nie impulsywnie.",
        ],
      },
      {
        type: "quote",
        text: "Kapitał rozwija się najlepiej wtedy, gdy trader potrafi myśleć spokojnie i długoterminowo.",
      },
      {
        type: "cta",
        text: "Opisz własne zasady zarządzania kapitałem na poziomie tygodnia i miesiąca.",
      },
    ],
  },

  "m17-l6-profesjonalny-trading": {
    blocks: [
      { type: "h2", text: "Profesjonalny trading" },
      {
        type: "p",
        text: "Profesjonalny trading opiera się na procesie, danych, dyscyplinie i odpowiedzialności. Nie chodzi o pojedynczy duży wynik, ale o stabilność działania.",
      },
      {
        type: "bullets",
        items: [
          "Profesjonalista działa według zasad.",
          "Nie ocenia się po jednym trade.",
          "Buduje przewagę na danych i powtarzalności.",
          "Myśli długoterminowo o kapitale i procesie.",
        ],
      },
      {
        type: "checklist",
        items: [
          { text: "Myślę procesowo." },
          { text: "Chronię kapitał." },
          { text: "Nie działam impulsywnie." },
        ],
      },
      {
        type: "quote",
        text: "Profesjonalizm w tradingu to spokój, liczby i powtarzalność.",
      },
      {
        type: "cta",
        text: "Napisz, co według Ciebie odróżnia początkującego tradera od profesjonalisty.",
      },
    ],
  },

  // =========================
  // MODUŁ 18 — BŁĘDY TRADERÓW
  // =========================
  "m18-l1-bledy-poczatkujacych": {
    blocks: [
      { type: "h2", text: "Błędy początkujących" },
      {
        type: "p",
        text: "Początkujący traderzy najczęściej tracą nie przez brak teorii, ale przez powtarzanie prostych błędów: pośpiech, brak planu i zbyt duże ryzyko.",
      },
      {
        type: "bullets",
        items: [
          "Trading bez planu.",
          "Gonienie rynku z FOMO.",
          "Za duży risk na pozycję.",
          "Brak cierpliwości i selekcji wejść.",
        ],
      },
      {
        type: "quote",
        text: "Błąd początkującego nie polega na tym, że nie wie wszystkiego. Błąd polega na tym, że działa za szybko bez procesu.",
      },
      {
        type: "cta",
        text: "Wypisz 3 błędy początkujących, które najbardziej przypominają Twoje własne zachowania.",
      },
    ],
  },

  "m18-l2-bledy-w-risk-management": {
    blocks: [
      { type: "h2", text: "Błędy w risk management" },
      {
        type: "p",
        text: "Błędy w zarządzaniu ryzykiem są jednymi z najbardziej kosztownych. Nawet dobry setup nie obroni złego risk managementu.",
      },
      {
        type: "bullets",
        items: [
          "Za duży risk na jeden trade.",
          "Brak limitu strat dziennych.",
          "Przesuwanie Stop Lossa bez logiki.",
          "Zwiększanie pozycji po stracie z emocji.",
        ],
      },
      {
        type: "quote",
        text: "Trader najczęściej nie przegrywa przez brak okazji. Przegrywa przez brak kontroli nad ryzykiem.",
      },
      {
        type: "cta",
        text: "Przejrzyj swoje ostatnie wejścia i sprawdź, czy nie popełniasz któregoś z tych błędów.",
      },
    ],
  },

  "m18-l3-bledy-psychologiczne": {
    blocks: [
      { type: "h2", text: "Błędy psychologiczne" },
      {
        type: "p",
        text: "Błędy psychologiczne pojawiają się wtedy, gdy emocje zaczynają sterować planem. To dlatego trader może znać teorię, ale nie umieć jej egzekwować.",
      },
      {
        type: "bullets",
        items: [
          "FOMO.",
          "Revenge trading.",
          "Brak cierpliwości.",
          "Strach przed stratą.",
          "Chciwość po serii zysków.",
        ],
      },
      {
        type: "quote",
        text: "Większość błędów technicznych zaczyna się jako błąd psychologiczny.",
      },
      {
        type: "cta",
        text: "Wybierz jeden błąd psychologiczny, który najbardziej przeszkadza Ci w tradingu i opisz go konkretnie.",
      },
    ],
  },

  "m18-l4-overtrading": {
    blocks: [
      { type: "h2", text: "Overtrading" },
      {
        type: "p",
        text: "Overtrading to robienie zbyt wielu wejść bez odpowiedniej jakości. To częsty problem traderów, którzy mylą aktywność z produktywnością.",
      },
      {
        type: "bullets",
        items: [
          "Więcej wejść nie oznacza lepszych wyników.",
          "Overtrading często wynika z nudy lub presji.",
          "Powoduje spadek jakości selekcji.",
          "Zwiększa zmęczenie i koszty.",
        ],
      },
      {
        type: "quote",
        text: "Najlepsze wyniki robi się na selekcji, nie na ilości.",
      },
      {
        type: "cta",
        text: "Sprawdź ile wejść w ostatnim tygodniu było naprawdę zgodnych z planem, a ile było tylko aktywnością.",
      },
    ],
  },

  "m18-l5-brak-planu": {
    blocks: [
      { type: "h2", text: "Brak planu" },
      {
        type: "p",
        text: "Brak planu tradingowego sprawia, że trader reaguje impulsywnie na to, co widzi na wykresie. Bez planu każda świeca może wyglądać jak okazja.",
      },
      {
        type: "bullets",
        items: [
          "Brak jasnych warunków wejścia.",
          "Brak zasad wyjścia.",
          "Brak limitów ryzyka.",
          "Brak spójności między sesjami.",
        ],
      },
      {
        type: "quote",
        text: "Jeśli nie masz planu, rynek będzie podejmował decyzje za Ciebie.",
      },
      {
        type: "cta",
        text: "Napisz 5 podstawowych zasad, które powinien zawierać Twój plan tradingowy.",
      },
    ],
  },

  "m18-l6-jak-unikac-bledow": {
    blocks: [
      { type: "h2", text: "Jak unikać błędów" },
      {
        type: "p",
        text: "Unikanie błędów nie polega na perfekcji. Polega na świadomym zauważaniu problemów, nazywaniu ich i budowaniu prostych zasad, które ograniczają ich powtarzanie.",
      },
      {
        type: "bullets",
        items: [
          "Nazwij błąd konkretnie.",
          "Znajdź jego przyczynę.",
          "Dodaj zasadę lub filtr ograniczający błąd.",
          "Sprawdzaj postęp w journalu i analizie sesji.",
        ],
      },
      {
        type: "checklist",
        items: [
          { text: "Potrafię nazwać swoje najczęstsze błędy." },
          { text: "Rozumiem skąd się biorą." },
          { text: "Mam plan jak je ograniczać." },
        ],
      },
      {
        type: "quote",
        text: "Trader nie rozwija się wtedy, gdy nie popełnia błędów. Trader rozwija się wtedy, gdy przestaje powtarzać te same.",
      },
      {
        type: "cta",
        text: "Stwórz listę 3 konkretnych zasad, które mają ograniczyć Twoje najczęstsze błędy.",
      },
    ],
  },
};