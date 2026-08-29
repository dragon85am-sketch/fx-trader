// components/QuizContent.ts

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

export type QuizContent = {
  title: string;
  passPercent: number;
  questions: QuizQuestion[];
};

export const QUIZ_CONTENT: Record<string, QuizContent> = {
  "m0-quiz-podstawy-tradingu": {
    title: "Quiz — Podstawy tradingu",
    passPercent: 70,
    questions: [
      {
        id: "m0q1",
        question: "Czym jest trading?",
        options: [
          "Losowym klikaniem buy/sell",
          "Procesem podejmowania decyzji na rynku",
          "Gwarantowanym sposobem zarabiania",
          "Tylko analizą newsów",
        ],
        correctIndex: 1,
        explanation:
          "Trading to proces decyzyjny oparty na analizie rynku i planie działania.",
      },
      {
        id: "m0q2",
        question: "Co oznacza buy na rynku?",
        options: [
          "Spekulację na spadek",
          "Zamknięcie pozycji",
          "Spekulację na wzrost",
          "Brak pozycji",
        ],
        correctIndex: 2,
      },
      {
        id: "m0q3",
        question: "Czym jest spread?",
        options: [
          "Wielkością pozycji",
          "Jednostką ruchu ceny",
          "Różnicą między ceną kupna i sprzedaży",
          "Rodzajem trendu",
        ],
        correctIndex: 2,
      },
      {
        id: "m0q4",
        question: "Broker to:",
        options: [
          "Pośrednik dający dostęp do rynku",
          "Strategia tradingowa",
          "Rodzaj wskaźnika",
          "Typ zlecenia",
        ],
        correctIndex: 0,
      },
      {
        id: "m0q5",
        question: "Co porusza rynek?",
        options: [
          "Tylko kolor świec",
          "Popyt, podaż i płynność",
          "Tylko emocje tradera",
          "Wyłącznie wskaźniki",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m1-quiz-platforma-tradingowa": {
    title: "Quiz — Platforma tradingowa",
    passPercent: 70,
    questions: [
      {
        id: "m1q1",
        question: "Do czego najczęściej używa się TradingView?",
        options: [
          "Do analizy wykresów",
          "Do wypłaty środków",
          "Do zarządzania brokerem",
          "Do zmiany spreadu",
        ],
        correctIndex: 0,
      },
      {
        id: "m1q2",
        question: "MT4 / MT5 służy głównie do:",
        options: [
          "Rysowania wykresów marketingowych",
          "Egzekucji zleceń",
          "Tworzenia newsów",
          "Liczenia pipsów ręcznie",
        ],
        correctIndex: 1,
      },
      {
        id: "m1q3",
        question: "Stop Loss powinien być:",
        options: [
          "Przypadkowy",
          "Ustawiany bez analizy",
          "Logiczny i zgodny z rynkiem",
          "Zawsze bardzo szeroki",
        ],
        correctIndex: 2,
      },
      {
        id: "m1q4",
        question: "Zlecenie market oznacza:",
        options: [
          "Wejście po aktualnej cenie",
          "Wejście dopiero jutro",
          "Wejście tylko na trendzie",
          "Zamknięcie wszystkich pozycji",
        ],
        correctIndex: 0,
      },
      {
        id: "m1q5",
        question: "Zarządzanie pozycją po wejściu powinno być:",
        options: [
          "Oparte na emocjach",
          "Oparte na zasadach",
          "Przypadkowe",
          "Zawsze takie samo bez kontekstu",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m2-quiz-wykresy-timeframe": {
    title: "Quiz — Wykresy i timeframe",
    passPercent: 70,
    questions: [
      {
        id: "m2q1",
        question:
          "Który wykres najczęściej daje najwięcej informacji o cenie?",
        options: ["Liniowy", "Świecowy", "Kołowy", "Histogram"],
        correctIndex: 1,
      },
      {
        id: "m2q2",
        question: "Timeframe oznacza:",
        options: [
          "Kolor świecy",
          "Rodzaj brokera",
          "Przedział czasu jednej świecy",
          "Spread instrumentu",
        ],
        correctIndex: 2,
      },
      {
        id: "m2q3",
        question: "Wyższy timeframe daje:",
        options: [
          "Szerszy kontekst rynku",
          "Więcej emocji",
          "Mniejszy wykres",
          "Gorszą analizę",
        ],
        correctIndex: 0,
      },
      {
        id: "m2q4",
        question: "Knot świecy może oznaczać:",
        options: [
          "Brak ceny",
          "Odrzucenie poziomu",
          "Awarię platformy",
          "Zamknięcie rynku",
        ],
        correctIndex: 1,
      },
      {
        id: "m2q5",
        question: "Momentum świec oznacza:",
        options: [
          "Siłę ruchu ceny",
          "Nazwę brokera",
          "Stały spread",
          "Brak decyzji rynku zawsze",
        ],
        correctIndex: 0,
      },
    ],
  },

  "m3-quiz-struktura-rynku": {
    title: "Quiz — Struktura rynku",
    passPercent: 70,
    questions: [
      {
        id: "m3q1",
        question: "HH i HL najczęściej oznaczają:",
        options: [
          "Trend wzrostowy",
          "Trend spadkowy",
          "Brak rynku",
          "Tylko konsolidację",
        ],
        correctIndex: 0,
      },
      {
        id: "m3q2",
        question: "LH i LL najczęściej oznaczają:",
        options: [
          "Trend wzrostowy",
          "Trend spadkowy",
          "Wybicie newsowe",
          "Brak ceny",
        ],
        correctIndex: 1,
      },
      {
        id: "m3q3",
        question: "BOS to:",
        options: [
          "Break of Structure",
          "Balance of Spread",
          "Buy Order Setup",
          "Basic Open Signal",
        ],
        correctIndex: 0,
      },
      {
        id: "m3q4",
        question: "CHoCH to najczęściej:",
        options: [
          "Pierwszy sygnał możliwej zmiany zachowania rynku",
          "Rodzaj brokera",
          "Typ zlecenia",
          "Wskaźnik wolumenu",
        ],
        correctIndex: 0,
      },
      {
        id: "m3q5",
        question: "Brak jasnej struktury zwykle oznacza:",
        options: [
          "Jasną przewagę",
          "Brak przewagi lub chaos",
          "Silny trend zawsze",
          "Pewny trade",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m4-quiz-trend": {
    title: "Quiz — Trend",
    passPercent: 70,
    questions: [
      {
        id: "m4q1",
        question: "Trend wzrostowy najczęściej oznacza:",
        options: [
          "Serię HH i HL",
          "Serię LH i LL",
          "Brak struktury",
          "Wyłącznie konsolidację",
        ],
        correctIndex: 0,
      },
      {
        id: "m4q2",
        question: "Konsolidacja najczęściej oznacza:",
        options: [
          "Jasny kierunek i kontynuację",
          "Chaos i brak przewagi kierunkowej",
          "Silny trend zawsze",
          "Pewne wejście w rynek",
        ],
        correctIndex: 1,
      },
      {
        id: "m4q3",
        question: "Bias rynku to:",
        options: [
          "Dokładny moment wejścia",
          "Kierunek, w którym chcesz szukać setupów",
          "Rodzaj brokera",
          "Typ Stop Lossa",
        ],
        correctIndex: 1,
      },
      {
        id: "m4q4",
        question: "Kiedy trader powinien odpuścić handel?",
        options: [
          "Gdy nie ma biasu lub rynek jest chaotyczny",
          "Tylko po zyskownym trade",
          "Nigdy",
          "Tylko rano",
        ],
        correctIndex: 0,
      },
      {
        id: "m4q5",
        question: "Multi Timeframe Analysis polega na:",
        options: [
          "Analizie tylko M1",
          "Łączeniu kontekstu z wyższego TF i wejścia z niższego TF",
          "Handlu bez planu",
          "Zmianie rynku co 5 minut",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m5-quiz-price-action": {
    title: "Quiz — Price action",
    passPercent: 70,
    questions: [
      {
        id: "m5q1",
        question: "Price action to:",
        options: [
          "Czytanie zachowania ceny bez opierania się wyłącznie na wskaźnikach",
          "Rodzaj platformy tradingowej",
          "Typ brokera",
          "System gwarantujący zysk",
        ],
        correctIndex: 0,
      },
      {
        id: "m5q2",
        question: "Pin bar ma największą wartość wtedy, gdy:",
        options: [
          "Pojawia się w dobrym miejscu na rynku",
          "Jest dowolnego koloru",
          "Powstaje zawsze na M1",
          "Ma bardzo mały knot",
        ],
        correctIndex: 0,
      },
      {
        id: "m5q3",
        question: "Engulfing pokazuje najczęściej:",
        options: [
          "Brak zainteresowania rynku",
          "Przejęcie kontroli przez jedną stronę rynku",
          "Stały spread",
          "Brak zmienności",
        ],
        correctIndex: 1,
      },
      {
        id: "m5q4",
        question: "Fake breakout to:",
        options: [
          "Mocne i prawdziwe wybicie z kontynuacją",
          "Pozorne wybicie, po którym cena wraca",
          "Typ Take Profitu",
          "Rodzaj konsolidacji",
        ],
        correctIndex: 1,
      },
      {
        id: "m5q5",
        question: "Price action działa najlepiej, gdy łączysz je z:",
        options: [
          "Przypadkiem",
          "Kontekstem, strukturą i miejscem reakcji",
          "Samym kolorem świecy",
          "Brakiem planu",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m6-quiz-setup-tradingowy": {
    title: "Quiz — Setup tradingowy",
    passPercent: 70,
    questions: [
      {
        id: "m6q1",
        question: "Setup tradingowy to:",
        options: [
          "Losowa sytuacja na wykresie",
          "Powtarzalna sytuacja rynkowa z jasno określonymi warunkami wejścia",
          "Każda świeca impulsowa",
          "Dowolny trade bez planu",
        ],
        correctIndex: 1,
      },
      {
        id: "m6q2",
        question: "W setupie 1-2-3 po impulsie zwykle pojawia się:",
        options: [
          "Korekta lub cofnięcie",
          "Natychmiastowe zamknięcie rynku",
          "Brak reakcji ceny",
          "Zmiana brokera",
        ],
        correctIndex: 0,
      },
      {
        id: "m6q3",
        question: "Breakout ma większą wartość, gdy:",
        options: [
          "Ma jakość, momentum i kontekst",
          "Jest zawsze pierwszy z brzegu",
          "Pojawia się bez poziomu",
          "Nie ma kontynuacji",
        ],
        correctIndex: 0,
      },
      {
        id: "m6q4",
        question: "Retest oznacza:",
        options: [
          "Powrót ceny do wcześniej wybitego poziomu",
          "Usunięcie Stop Lossa",
          "Wejście bez potwierdzenia",
          "Rodzaj overtradingu",
        ],
        correctIndex: 0,
      },
      {
        id: "m6q5",
        question: "Checklist setupu pomaga:",
        options: [
          "Podejmować decyzje impulsywnie",
          "Sprawdzić, czy trade spełnia warunki procesu",
          "Wejść szybciej bez analizy",
          "Zastąpić risk management",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m7-quiz-timing": {
    title: "Quiz – Timing",
    passPercent: 70,
    questions: [
      {
        id: "m7q1",
        question: "Czym jest timing wejścia?",
        options: [
          "Losowym wejściem w rynek",
          "Momentem wejścia zgodnym z kontekstem i setupem",
          "Zawsze wejściem na M1",
          "Szybkim kliknięciem po impulsie",
        ],
        correctIndex: 1,
      },
      {
        id: "m7q2",
        question: "M1 służy głównie do:",
        options: [
          "Budowania głównego biasu",
          "Precyzyjnego timing wejścia",
          "Liczenia spreadu",
          "Oceny brokera",
        ],
        correctIndex: 1,
      },
      {
        id: "m7q3",
        question: "M5 względem M1 jest zwykle:",
        options: [
          "Bardziej chaotyczny",
          "Spokojniejszy i czytelniejszy",
          "Zawsze szybszy",
          "Bezużyteczny",
        ],
        correctIndex: 1,
      },
      {
        id: "m7q4",
        question: "Potwierdzenie wejścia ma sens:",
        options: [
          "W dowolnym miejscu rynku",
          "Tylko po stracie",
          "W dobrym miejscu i kontekście",
          "Tylko na newsach",
        ],
        correctIndex: 2,
      },
      {
        id: "m7q5",
        question: "Najgorszy timing to najczęściej:",
        options: [
          "Wejście po planie",
          "Wejście po emocjonalnym gonieniu impulsu",
          "Wejście po retestcie",
          "Wejście zgodne z biasem",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m8-quiz-liquidity": {
    title: "Quiz – Liquidity",
    passPercent: 70,
    questions: [
      {
        id: "m8q1",
        question: "Czym jest liquidity na rynku?",
        options: [
          "Kolorem świecy",
          "Miejscem, gdzie znajdują się zlecenia uczestników rynku",
          "Rodzajem wskaźnika",
          "Tylko spreadem brokera",
        ],
        correctIndex: 1,
      },
      {
        id: "m8q2",
        question: "Liquidity najczęściej znajduje się:",
        options: [
          "W losowych miejscach",
          "Nad swing high i pod swing low",
          "Tylko na M1",
          "Tylko po newsach",
        ],
        correctIndex: 1,
      },
      {
        id: "m8q3",
        question: "Liquidity sweep to:",
        options: [
          "Stały trend bez cofnięcia",
          "Wybicie poziomu w celu zebrania stop lossów i powrót ceny",
          "Rodzaj trailing stopa",
          "Typ zlecenia oczekującego",
        ],
        correctIndex: 1,
      },
      {
        id: "m8q4",
        question: "Stop hunt oznacza najczęściej:",
        options: [
          "Zbieranie płynności ze stop lossów traderów",
          "Zamykanie platformy",
          "Brak zmienności",
          "Losowy ruch świecy",
        ],
        correctIndex: 0,
      },
      {
        id: "m8q5",
        question: "Equal highs i equal lows są ważne, ponieważ:",
        options: [
          "Nie mają znaczenia",
          "Często przyciągają płynność",
          "Zawsze oznaczają koniec trendu",
          "Są tylko błędem wykresu",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m9-quiz-risk-management": {
    title: "Quiz – Risk management",
    passPercent: 70,
    questions: [
      {
        id: "m9q1",
        question: "Czym jest risk management?",
        options: [
          "Sposobem na przewidywanie rynku",
          "Zestawem zasad chroniących kapitał",
          "Rodzajem wskaźnika",
          "Typem zlecenia",
        ],
        correctIndex: 1,
      },
      {
        id: "m9q2",
        question: "Czym jest RR?",
        options: [
          "Relacją zysku do ryzyka",
          "Rodzajem świecy",
          "Wskaźnikiem trendu",
          "Kosztem spreadu",
        ],
        correctIndex: 0,
      },
      {
        id: "m9q3",
        question: "Wielkość pozycji powinna wynikać z:",
        options: [
          "Emocji tradera",
          "Tego ile chcesz zarobić",
          "Ryzyka i miejsca Stop Lossa",
          "Koloru świecy",
        ],
        correctIndex: 2,
      },
      {
        id: "m9q4",
        question: "Po serii strat trader powinien:",
        options: [
          "Podwoić pozycję",
          "Wejść bez planu, żeby odrobić",
          "Trzymać się limitów i procesu",
          "Usunąć Stop Lossa",
        ],
        correctIndex: 2,
      },
      {
        id: "m9q5",
        question: "Najważniejszym celem risk managementu jest:",
        options: [
          "Zwiększanie liczby trade",
          "Ochrona kapitału",
          "Zwiększanie emocji",
          "Szybsze wejścia",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m10-quiz-zarzadzanie-pozycja": {
    title: "Quiz – Zarządzanie pozycją",
    passPercent: 70,
    questions: [
      {
        id: "m10q1",
        question: "Kiedy zaczyna się zarządzanie pozycją?",
        options: [
          "Po zamknięciu trade",
          "Po wejściu w trade",
          "Przed analizą",
          "Nigdy",
        ],
        correctIndex: 1,
      },
      {
        id: "m10q2",
        question: "Czego nie powinien robić trader?",
        options: [
          "Zmieniać plan bez powodu",
          "Kontrolować ryzyko",
          "Analizować strukturę",
          "Planować wyjście",
        ],
        correctIndex: 0,
      },
      {
        id: "m10q3",
        question: "Partial TP polega na:",
        options: [
          "Całkowitym usunięciu pozycji od razu",
          "Częściowym zamknięciu pozycji",
          "Braku Take Profitu",
          "Przesuwaniu Stop Lossa bez planu",
        ],
        correctIndex: 1,
      },
      {
        id: "m10q4",
        question: "Trailing stop ma głównie:",
        options: [
          "Zwiększać emocje",
          "Chronić rosnący zysk",
          "Zastępować analizę",
          "Usuwać konieczność planu",
        ],
        correctIndex: 1,
      },
      {
        id: "m10q5",
        question: "Wyjście z trade powinno wynikać z:",
        options: [
          "Chwilowego strachu",
          "Planu i logiki rynku",
          "Losowej decyzji",
          "Koloru świecy",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m11-quiz-psychologia-tradingu": {
    title: "Quiz – Psychologia tradingu",
    passPercent: 70,
    questions: [
      {
        id: "m11q1",
        question: "Największym przeciwnikiem tradera często są:",
        options: [
          "Świece",
          "Spread",
          "Własne emocje",
          "Kolory wykresu",
        ],
        correctIndex: 2,
      },
      {
        id: "m11q2",
        question: "FOMO oznacza:",
        options: [
          "Trading według planu",
          "Strach przed przegapieniem ruchu",
          "Rodzaj Stop Lossa",
          "Typ konsolidacji",
        ],
        correctIndex: 1,
      },
      {
        id: "m11q3",
        question: "Revenge trading to:",
        options: [
          "Spokojne wejście zgodne z planem",
          "Impulsywna próba odrobienia straty",
          "Trading tylko po newsach",
          "Zamykanie pozycji na BE",
        ],
        correctIndex: 1,
      },
      {
        id: "m11q4",
        question: "Overtrading najczęściej oznacza:",
        options: [
          "Za dużą selekcję wejść",
          "Zbyt częste wejścia bez jakości",
          "Handel tylko na M1",
          "Brak emocji",
        ],
        correctIndex: 1,
      },
      {
        id: "m11q5",
        question: "Profesjonalny trader powinien oceniać się głównie po:",
        options: [
          "Wyniku jednego trade",
          "Jakości procesu",
          "Długości sesji",
          "Liczbie wejść",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m12-quiz-rutyna-tradera": {
    title: "Quiz – Rutyna tradera",
    passPercent: 70,
    questions: [
      {
        id: "m12q1",
        question: "Dobry plan dnia tradera pomaga przede wszystkim:",
        options: [
          "Zwiększyć chaos",
          "Zmniejszyć impulsywność",
          "Skrócić wykres",
          "Usunąć straty",
        ],
        correctIndex: 1,
      },
      {
        id: "m12q2",
        question: "Analiza przed sesją służy do:",
        options: [
          "Chaotycznego reagowania",
          "Przygotowania scenariusza",
          "Usuwania Stop Lossa",
          "Zwiększania lota",
        ],
        correctIndex: 1,
      },
      {
        id: "m12q3",
        question: "Rutyna tradingowa pomaga:",
        options: [
          "Budować spójność działania",
          "Handlować bez planu",
          "Zwiększać emocje",
          "Pomijać analizę",
        ],
        correctIndex: 0,
      },
      {
        id: "m12q4",
        question: "Analiza po sesji powinna zawierać:",
        options: [
          "Tylko wynik finansowy",
          "Ocenę decyzji i wnioski",
          "Tylko screen wykresu",
          "Wyłącznie emocje",
        ],
        correctIndex: 1,
      },
      {
        id: "m12q5",
        question: "Dyscyplina w tradingu to:",
        options: [
          "Perfekcja bez błędów",
          "Wykonywanie planu mimo emocji",
          "Częste zmienianie zasad",
          "Handel tylko codziennie",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m13-quiz-trading-journal": {
    title: "Quiz – Trading Journal",
    passPercent: 70,
    questions: [
      {
        id: "m13q1",
        question: "Trading journal pomaga przede wszystkim:",
        options: [
          "Zgadywać rynek",
          "Analizować błędy i mocne strony",
          "Zwiększać liczbę wejść",
          "Pomijać statystyki",
        ],
        correctIndex: 1,
      },
      {
        id: "m13q2",
        question: "Dobry journal powinien zawierać:",
        options: [
          "Tylko wynik finansowy",
          "Dane trade, kontekst i emocje",
          "Tylko nazwę instrumentu",
          "Wyłącznie screen wykresu",
        ],
        correctIndex: 1,
      },
      {
        id: "m13q3",
        question: "Analiza trade powinna oceniać głównie:",
        options: [
          "Wyłącznie zysk",
          "Jakość procesu",
          "Kolor świecy",
          "Spread brokera",
        ],
        correctIndex: 1,
      },
      {
        id: "m13q4",
        question: "Wyniki poprawiają się najczęściej wtedy, gdy:",
        options: [
          "Poprawiasz proces",
          "Zwiększasz lota",
          "Handlujesz częściej",
          "Zmniejszasz cierpliwość",
        ],
        correctIndex: 0,
      },
      {
        id: "m13q5",
        question: "Budowanie statystyk w journalu pomaga:",
        options: [
          "Ocenić, czy system ma przewagę",
          "Usunąć emocje natychmiast",
          "Zawsze mieć 100% skuteczności",
          "Nie notować błędów",
        ],
        correctIndex: 0,
      },
    ],
  },

  "m14-quiz-case-study": {
    title: "Quiz – Case study",
    passPercent: 70,
    questions: [
      {
        id: "m14q1",
        question: "Case study realnego trade służy do:",
        options: [
          "Pokazania całego procesu decyzji",
          "Tylko policzenia zysku",
          "Ukrycia błędów",
          "Losowego oceniania wejścia",
        ],
        correctIndex: 0,
      },
      {
        id: "m14q2",
        question: "Analiza sesji tradingowej pomaga zobaczyć:",
        options: [
          "Tylko jeden setup",
          "Szerszy obraz decyzji z całego dnia",
          "Wyłącznie wynik końcowy",
          "Tylko moment wejścia",
        ],
        correctIndex: 1,
      },
      {
        id: "m14q3",
        question: "Rozpisanie trade krok po kroku pomaga:",
        options: [
          "Ukryć emocje",
          "Zobaczyć gdzie pojawił się błąd",
          "Skrócić analizę do minimum",
          "Pominąć zarządzanie pozycją",
        ],
        correctIndex: 1,
      },
      {
        id: "m14q4",
        question: "Poprawna analiza trade powinna być:",
        options: [
          "Emocjonalna i ogólna",
          "Konkretna i oparta na faktach",
          "Chaotyczna",
          "Nastawiona na wymówki",
        ],
        correctIndex: 1,
      },
      {
        id: "m14q5",
        question: "Najważniejszą częścią case study są:",
        options: [
          "Kolory świec",
          "Wnioski do wdrożenia",
          "Nazwy wskaźników",
          "Długość pozycji",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m15-quiz-system-tradingowy": {
    title: "Quiz – System tradingowy",
    passPercent: 70,
    questions: [
      {
        id: "m15q1",
        question: "System tradingowy to:",
        options: [
          "Zbiór zasad wejścia, wyjścia i ryzyka",
          "Jeden losowy setup",
          "Typ wskaźnika",
          "Platforma tradingowa",
        ],
        correctIndex: 0,
      },
      {
        id: "m15q2",
        question: "Budowanie strategii polega na:",
        options: [
          "Łączeniu setupu, ryzyka i zasad działania",
          "Kopiowaniu cudzych wejść",
          "Handlu bez planu",
          "Zmianie systemu codziennie",
        ],
        correctIndex: 0,
      },
      {
        id: "m15q3",
        question: "Checklist trade pomaga:",
        options: [
          "Pomijać zasady",
          "Sprawdzić, czy wejście spełnia warunki systemu",
          "Handlować szybciej bez analizy",
          "Usunąć Stop Lossa",
        ],
        correctIndex: 1,
      },
      {
        id: "m15q4",
        question: "Edge tradera to:",
        options: [
          "Gwarancja wygranej w każdym trade",
          "Powtarzalna przewaga w serii trade",
          "Rodzaj brokera",
          "Typ świecy",
        ],
        correctIndex: 1,
      },
      {
        id: "m15q5",
        question: "Testowanie strategii jest potrzebne, aby:",
        options: [
          "Sprawdzić, czy system naprawdę działa",
          "Unikać notatek",
          "Zwiększyć emocje",
          "Handlować bez danych",
        ],
        correctIndex: 0,
      },
    ],
  },

  "m16-quiz-statystyka-tradingowa": {
    title: "Quiz – Statystyka tradingowa",
    passPercent: 70,
    questions: [
      {
        id: "m16q1",
        question: "Win rate oznacza:",
        options: [
          "Procent wygranych trade",
          "Wielkość Stop Lossa",
          "Spread brokera",
          "Poziom emocji",
        ],
        correctIndex: 0,
      },
      {
        id: "m16q2",
        question: "Expectancy pokazuje:",
        options: [
          "Średni oczekiwany wynik trade w dłuższym okresie",
          "Kolor świecy",
          "Rodzaj trendu",
          "Tylko win rate",
        ],
        correctIndex: 0,
      },
      {
        id: "m16q3",
        question: "Edge ujawnia się najczęściej:",
        options: [
          "W jednym trade",
          "W większej próbce danych",
          "Tylko na demo",
          "Wyłącznie po newsach",
        ],
        correctIndex: 1,
      },
      {
        id: "m16q4",
        question: "Backtesting polega na:",
        options: [
          "Testowaniu strategii na danych historycznych",
          "Handlu bez planu",
          "Zgadywaniu rynku",
          "Usuwaniu błędów z pamięci",
        ],
        correctIndex: 0,
      },
      {
        id: "m16q5",
        question: "Optymalizacja strategii powinna opierać się na:",
        options: [
          "Emocjach po kilku trade",
          "Danych i małych, mierzalnych zmianach",
          "Codziennym zmienianiu systemu",
          "Przypadku",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m17-quiz-skalowanie-konta": {
    title: "Quiz – Skalowanie konta",
    passPercent: 70,
    questions: [
      {
        id: "m17q1",
        question: "Skalowanie konta oznacza:",
        options: [
          "Losowe zwiększanie lota",
          "Stopniowe zwiększanie skali przy stabilnych wynikach",
          "Usuwanie risk managementu",
          "Handel bez planu",
        ],
        correctIndex: 1,
      },
      {
        id: "m17q2",
        question: "Większy kapitał najczęściej:",
        options: [
          "Zmniejsza emocje automatycznie",
          "Zwiększa presję psychiczną",
          "Usuwa potrzebę planu",
          "Gwarantuje lepsze wyniki",
        ],
        correctIndex: 1,
      },
      {
        id: "m17q3",
        question: "Trading w prop firmach wymaga szczególnie:",
        options: [
          "Agresji i dużego ryzyka",
          "Dyscypliny i kontroli drawdown",
          "Braku limitów",
          "Codziennej zmiany strategii",
        ],
        correctIndex: 1,
      },
      {
        id: "m17q4",
        question: "Funded account wymaga przede wszystkim:",
        options: [
          "Stabilności i przestrzegania zasad",
          "Losowych dużych zysków",
          "Braku Stop Lossa",
          "Tradingu bez journalu",
        ],
        correctIndex: 0,
      },
      {
        id: "m17q5",
        question: "Profesjonalny trading opiera się głównie na:",
        options: [
          "Impulsach",
          "Procesie, danych i dyscyplinie",
          "Szczęściu",
          "Codziennym zmienianiu zasad",
        ],
        correctIndex: 1,
      },
    ],
  },

  "m18-quiz-bledy-traderow": {
    title: "Quiz – Błędy traderów",
    passPercent: 70,
    questions: [
      {
        id: "m18q1",
        question: "Jednym z najczęstszych błędów początkujących jest:",
        options: [
          "Zbyt dobra selekcja wejść",
          "Trading bez planu",
          "Za małe emocje",
          "Za dużo cierpliwości",
        ],
        correctIndex: 1,
      },
      {
        id: "m18q2",
        question: "Błąd w risk management najczęściej polega na:",
        options: [
          "Za dużym ryzyku na trade",
          "Zbyt dobrym planie",
          "Za małej liczbie wykresów",
          "Zbyt spokojnym podejściu",
        ],
        correctIndex: 0,
      },
      {
        id: "m18q3",
        question: "Błędy psychologiczne to między innymi:",
        options: [
          "FOMO i revenge trading",
          "Trend i BOS",
          "Spread i lot",
          "Take Profit i Stop Loss",
        ],
        correctIndex: 0,
      },
      {
        id: "m18q4",
        question: "Overtrading oznacza:",
        options: [
          "Zbyt dużo wejść bez jakości",
          "Zbyt mało emocji",
          "Zbyt dobry timing",
          "Brak wykresów",
        ],
        correctIndex: 0,
      },
      {
        id: "m18q5",
        question: "Unikanie błędów polega głównie na:",
        options: [
          "Ignorowaniu problemów",
          "Nazywaniu błędów i budowaniu zasad ograniczających",
          "Handlu bez analizy",
          "Zwiększaniu lota po stracie",
        ],
        correctIndex: 1,
      },
    ],
  },
};