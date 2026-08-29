export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type CourseQuiz = {
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
};

export const COURSE_QUIZZES: Record<string, CourseQuiz> = {
  "m0-quiz-podstawy-tradingu": {
    title: "Quiz – Podstawy tradingu",
    passingScore: 70,
    questions: [
      {
        question: "Czym jest trading?",
        options: [
          "Losowym kupowaniem i sprzedawaniem",
          "Procesem podejmowania decyzji na podstawie analizy rynku",
          "Tylko trzymaniem inwestycji przez lata",
          "Wyłącznie handlem kryptowalutami",
        ],
        correctIndex: 1,
      },
      {
        question: "Co oznacza para walutowa EUR/USD?",
        options: [
          "Relację euro do dolara",
          "Relację euro do złota",
          "Relację dolara do bitcoina",
          "Relację euro do ropy",
        ],
        correctIndex: 0,
      },
      {
        question: "Czym jest spread?",
        options: [
          "Wielkością konta",
          "Zyskiem z pozycji",
          "Różnicą między ceną kupna i sprzedaży",
          "Rodzajem trendu",
        ],
        correctIndex: 2,
      },
      {
        question: "Jaką rolę pełni broker?",
        options: [
          "Gwarantuje zysk",
          "Podejmuje decyzje za tradera",
          "Daje dostęp do rynku i realizuje zlecenia",
          "Usuwa ryzyko z tradingu",
        ],
        correctIndex: 2,
      },
      {
        question: "Co porusza cenę na rynku?",
        options: [
          "Wyłącznie wskaźniki",
          "Tylko przypadek",
          "Popyt i podaż oraz aktywność uczestników rynku",
          "Kolor świec",
        ],
        correctIndex: 2,
      },
    ],
  },

  "m1-quiz-platforma-tradingowa": {
    title: "Quiz – Platforma tradingowa",
    passingScore: 70,
    questions: [
      {
        question: "Do czego najczęściej służy TradingView?",
        options: [
          "Do prowadzenia księgowości",
          "Do analizy wykresów",
          "Do wypłaty środków",
          "Do liczenia podatków",
        ],
        correctIndex: 1,
      },
      {
        question: "Do czego służy MT4 / MT5?",
        options: [
          "Głównie do egzekucji zleceń",
          "Tylko do oglądania newsów",
          "Wyłącznie do rysowania trendline",
          "Do edycji wideo",
        ],
        correctIndex: 0,
      },
      {
        question: "Kiedy powinieneś otwierać trade?",
        options: [
          "Gdy rynek szybko się rusza",
          "Gdy masz nudę",
          "Po analizie i spełnieniu warunków setupu",
          "Po każdej świecy impulsowej",
        ],
        correctIndex: 2,
      },
      {
        question: "Po co ustawiasz Stop Loss?",
        options: [
          "Żeby zwiększyć spread",
          "Żeby chronić konto przed większą stratą",
          "Żeby broker mniej zarobił",
          "Żeby wykres wyglądał lepiej",
        ],
        correctIndex: 1,
      },
      {
        question: "Czym jest zlecenie market?",
        options: [
          "Wejściem natychmiast po aktualnej cenie",
          "Wejściem dopiero jutro",
          "Wejściem po lepszej cenie przy cofnięciu",
          "Wejściem tylko na demo",
        ],
        correctIndex: 0,
      },
    ],
  },

  "m2-quiz-wykresy-timeframe": {
    title: "Quiz – Wykresy i timeframe",
    passingScore: 70,
    questions: [
      {
        question: "Który wykres najczęściej używany jest w tradingu?",
        options: [
          "Kołowy",
          "Świecowy",
          "Punktowy",
          "Tabelaryczny",
        ],
        correctIndex: 1,
      },
      {
        question: "Czym jest timeframe?",
        options: [
          "Kolorem świecy",
          "Przedziałem czasu, z którego budowana jest świeca",
          "Rodzajem brokera",
          "Typem zlecenia",
        ],
        correctIndex: 1,
      },
      {
        question: "Co daje wyższy timeframe?",
        options: [
          "Większy chaos",
          "Szerszy kontekst rynku",
          "Niższy spread",
          "Automatyczny zysk",
        ],
        correctIndex: 1,
      },
      {
        question: "Co może oznaczać długi knot świecy?",
        options: [
          "Brak ceny",
          "Odrzucenie poziomu",
          "Awarię brokera",
          "Koniec trendu zawsze",
        ],
        correctIndex: 1,
      },
      {
        question: "Co pokazuje momentum świec?",
        options: [
          "Siłę ruchu ceny",
          "Nazwę brokera",
          "Wielkość konta",
          "Tylko godzinę wejścia",
        ],
        correctIndex: 0,
      },
    ],
  },

  "m3-quiz-struktura-rynku": {
    title: "Quiz – Struktura rynku",
    passingScore: 70,
    questions: [
      {
        question: "Co oznacza HH?",
        options: [
          "Higher High",
          "Higher Hedge",
          "Hidden High",
          "Heavy Hold",
        ],
        correctIndex: 0,
      },
      {
        question: "Jaki układ wskazuje przewagę kupujących?",
        options: [
          "LH + LL",
          "HH + HL",
          "LL + HL",
          "Range + knoty",
        ],
        correctIndex: 1,
      },
      {
        question: "Co oznacza BOS?",
        options: [
          "Break of Structure",
          "Break of Session",
          "Bias of Strategy",
          "Base of Swing",
        ],
        correctIndex: 0,
      },
      {
        question: "Czym jest CHoCH?",
        options: [
          "Potwierdzeniem zysku",
          "Rodzajem spreadu",
          "Pierwszym sygnałem zmiany charakteru rynku",
          "Typem Take Profit",
        ],
        correctIndex: 2,
      },
      {
        question: "Kiedy struktura nie daje przewagi?",
        options: [
          "Gdy rynek jest czytelny",
          "Gdy cena tworzy chaos bez jasnego układu",
          "Gdy są HH i HL",
          "Gdy jest mocne momentum",
        ],
        correctIndex: 1,
      },
    ],
  },
};