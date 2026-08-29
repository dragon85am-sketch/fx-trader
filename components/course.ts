// components/course.ts

export type CourseItemType = "lesson" | "quiz";

export type CourseLesson = {
  id: string;
  title: string;
  module: string;
  moduleTitle: string;
  order: number;
  type: CourseItemType;
  minutes?: number;
  free?: boolean;
};

export const COURSE: {
  modules: { title: string; items: CourseLesson[] }[];
} = {
  modules: [
    {
      title: "Moduł 0 – Podstawy tradingu",
      items: [
        {
          id: "m0-l1-czym-jest-trading",
          title: "Czym jest trading",
          module: "Moduł 0",
          moduleTitle: "Moduł 0 – Podstawy tradingu",
          order: 1,
          type: "lesson",
          minutes: 8,
          free: true,
        },
        {
          id: "m0-l2-jak-dziala-rynek-forex",
          title: "Jak działa rynek Forex",
          module: "Moduł 0",
          moduleTitle: "Moduł 0 – Podstawy tradingu",
          order: 2,
          type: "lesson",
          minutes: 10,
          free: true,
        },
        {
          id: "m0-l3-pips-lot-spread",
          title: "Pips, lot, spread – podstawowe pojęcia",
          module: "Moduł 0",
          moduleTitle: "Moduł 0 – Podstawy tradingu",
          order: 3,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m0-l4-rodzaje-rynkow",
          title: "Rodzaje rynków",
          module: "Moduł 0",
          moduleTitle: "Moduł 0 – Podstawy tradingu",
          order: 4,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m0-l5-jak-dziala-broker",
          title: "Jak działa broker",
          module: "Moduł 0",
          moduleTitle: "Moduł 0 – Podstawy tradingu",
          order: 5,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m0-l6-jak-powstaje-cena",
          title: "Jak powstaje cena na rynku",
          module: "Moduł 0",
          moduleTitle: "Moduł 0 – Podstawy tradingu",
          order: 6,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m0-quiz-podstawy-tradingu",
          title: "Quiz – Podstawy tradingu",
          module: "Moduł 0",
          moduleTitle: "Moduł 0 – Podstawy tradingu",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 1 – Platforma tradingowa",
      items: [
        {
          id: "m1-l1-tradingview-podstawy",
          title: "TradingView – podstawy",
          module: "Moduł 1",
          moduleTitle: "Moduł 1 – Platforma tradingowa",
          order: 1,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m1-l2-mt4-mt5",
          title: "MT4 / MT5 – jak działa platforma",
          module: "Moduł 1",
          moduleTitle: "Moduł 1 – Platforma tradingowa",
          order: 2,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m1-l3-jak-otworzyc-trade",
          title: "Jak otworzyć trade",
          module: "Moduł 1",
          moduleTitle: "Moduł 1 – Platforma tradingowa",
          order: 3,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m1-l4-stop-loss-take-profit",
          title: "Stop Loss i Take Profit",
          module: "Moduł 1",
          moduleTitle: "Moduł 1 – Platforma tradingowa",
          order: 4,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m1-l5-typy-zlecen",
          title: "Typy zleceń: market / limit / stop",
          module: "Moduł 1",
          moduleTitle: "Moduł 1 – Platforma tradingowa",
          order: 5,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m1-l6-zarzadzanie-pozycja",
          title: "Zarządzanie pozycją",
          module: "Moduł 1",
          moduleTitle: "Moduł 1 – Platforma tradingowa",
          order: 6,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m1-quiz-platforma-tradingowa",
          title: "Quiz – Platforma tradingowa",
          module: "Moduł 1",
          moduleTitle: "Moduł 1 – Platforma tradingowa",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 2 – Wykresy i timeframe",
      items: [
        {
          id: "m2-l1-typy-wykresow",
          title: "Typy wykresów",
          module: "Moduł 2",
          moduleTitle: "Moduł 2 – Wykresy i timeframe",
          order: 1,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m2-l2-timeframe",
          title: "Timeframe – jak go używać",
          module: "Moduł 2",
          moduleTitle: "Moduł 2 – Wykresy i timeframe",
          order: 2,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m2-l3-swiece-japonskie",
          title: "Świece japońskie",
          module: "Moduł 2",
          moduleTitle: "Moduł 2 – Wykresy i timeframe",
          order: 3,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m2-l4-jak-czytac-swiece",
          title: "Jak czytać świeczki",
          module: "Moduł 2",
          moduleTitle: "Moduł 2 – Wykresy i timeframe",
          order: 4,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m2-l5-struktura-swiecy",
          title: "Struktura świecy",
          module: "Moduł 2",
          moduleTitle: "Moduł 2 – Wykresy i timeframe",
          order: 5,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m2-l6-momentum-swiec",
          title: "Momentum świec",
          module: "Moduł 2",
          moduleTitle: "Moduł 2 – Wykresy i timeframe",
          order: 6,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m2-quiz-wykresy-timeframe",
          title: "Quiz – Wykresy i timeframe",
          module: "Moduł 2",
          moduleTitle: "Moduł 2 – Wykresy i timeframe",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 3 – Struktura rynku",
      items: [
        {
          id: "m3-l1-hh-hl-lh-ll",
          title: "HH / HL vs LH / LL",
          module: "Moduł 3",
          moduleTitle: "Moduł 3 – Struktura rynku",
          order: 1,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m3-l2-jak-rozpoznac-trend",
          title: "Jak rozpoznać trend",
          module: "Moduł 3",
          moduleTitle: "Moduł 3 – Struktura rynku",
          order: 2,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m3-l3-zmiana-struktury",
          title: "Zmiana struktury rynku",
          module: "Moduł 3",
          moduleTitle: "Moduł 3 – Struktura rynku",
          order: 3,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m3-l4-bos",
          title: "BOS – Break of Structure",
          module: "Moduł 3",
          moduleTitle: "Moduł 3 – Struktura rynku",
          order: 4,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m3-l5-choch",
          title: "CHoCH – Change of Character",
          module: "Moduł 3",
          moduleTitle: "Moduł 3 – Struktura rynku",
          order: 5,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m3-l6-struktura-w-praktyce",
          title: "Struktura w praktyce",
          module: "Moduł 3",
          moduleTitle: "Moduł 3 – Struktura rynku",
          order: 6,
          type: "lesson",
          minutes: 12,
        },
        {
          id: "m3-quiz-struktura-rynku",
          title: "Quiz – Struktura rynku",
          module: "Moduł 3",
          moduleTitle: "Moduł 3 – Struktura rynku",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 4 – Trend",
      items: [
        {
          id: "m4-l1-co-to-jest-trend",
          title: "Co to jest trend",
          module: "Moduł 4",
          moduleTitle: "Moduł 4 – Trend",
          order: 1,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m4-l2-trend-vs-konsolidacja",
          title: "Trend vs konsolidacja",
          module: "Moduł 4",
          moduleTitle: "Moduł 4 – Trend",
          order: 2,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m4-l3-jak-okreslic-bias",
          title: "Jak określić bias rynku",
          module: "Moduł 4",
          moduleTitle: "Moduł 4 – Trend",
          order: 3,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m4-l4-kiedy-nie-handlowac",
          title: "Kiedy nie handlować",
          module: "Moduł 4",
          moduleTitle: "Moduł 4 – Trend",
          order: 4,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m4-l5-trend-na-roznych-timeframe",
          title: "Trend na różnych timeframe",
          module: "Moduł 4",
          moduleTitle: "Moduł 4 – Trend",
          order: 5,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m4-l6-multi-timeframe-analysis",
          title: "Multi timeframe analysis",
          module: "Moduł 4",
          moduleTitle: "Moduł 4 – Trend",
          order: 6,
          type: "lesson",
          minutes: 11,
        },
        {
          id: "m4-quiz-trend",
          title: "Quiz – Trend",
          module: "Moduł 4",
          moduleTitle: "Moduł 4 – Trend",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 5 – Price Action",
      items: [
        {
          id: "m5-l1-podstawy-price-action",
          title: "Podstawy price action",
          module: "Moduł 5",
          moduleTitle: "Moduł 5 – Price Action",
          order: 1,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m5-l2-momentum-ceny",
          title: "Momentum ceny",
          module: "Moduł 5",
          moduleTitle: "Moduł 5 – Price Action",
          order: 2,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m5-l3-pin-bar",
          title: "Pin bar",
          module: "Moduł 5",
          moduleTitle: "Moduł 5 – Price Action",
          order: 3,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m5-l4-engulfing",
          title: "Engulfing",
          module: "Moduł 5",
          moduleTitle: "Moduł 5 – Price Action",
          order: 4,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m5-l5-fake-breakout",
          title: "Fake breakout",
          module: "Moduł 5",
          moduleTitle: "Moduł 5 – Price Action",
          order: 5,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m5-l6-price-action-w-praktyce",
          title: "Price action w praktyce",
          module: "Moduł 5",
          moduleTitle: "Moduł 5 – Price Action",
          order: 6,
          type: "lesson",
          minutes: 11,
        },
        {
          id: "m5-quiz-price-action",
          title: "Quiz – Price Action",
          module: "Moduł 5",
          moduleTitle: "Moduł 5 – Price Action",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 6 – Setup tradingowy",
      items: [
        {
          id: "m6-l1-co-to-jest-setup",
          title: "Co to jest setup tradingowy",
          module: "Moduł 6",
          moduleTitle: "Moduł 6 – Setup tradingowy",
          order: 1,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m6-l2-setup-1-2-3",
          title: "Setup 1-2-3",
          module: "Moduł 6",
          moduleTitle: "Moduł 6 – Setup tradingowy",
          order: 2,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m6-l3-breakout",
          title: "Breakout",
          module: "Moduł 6",
          moduleTitle: "Moduł 6 – Setup tradingowy",
          order: 3,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m6-l4-retest",
          title: "Retest",
          module: "Moduł 6",
          moduleTitle: "Moduł 6 – Setup tradingowy",
          order: 4,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m6-l5-falszywe-wybicie",
          title: "Fałszywe wybicie",
          module: "Moduł 6",
          moduleTitle: "Moduł 6 – Setup tradingowy",
          order: 5,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m6-l6-checklist-setupu",
          title: "Checklist setupu",
          module: "Moduł 6",
          moduleTitle: "Moduł 6 – Setup tradingowy",
          order: 6,
          type: "lesson",
          minutes: 11,
        },
        {
          id: "m6-quiz-setup-tradingowy",
          title: "Quiz – Setup tradingowy",
          module: "Moduł 6",
          moduleTitle: "Moduł 6 – Setup tradingowy",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 7 – Timing",
      items: [
        {
          id: "m7-l1-timing-wejscia",
          title: "Timing wejścia",
          module: "Moduł 7",
          moduleTitle: "Moduł 7 – Timing",
          order: 1,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m7-l2-wejscia-na-m1",
          title: "Wejścia na M1",
          module: "Moduł 7",
          moduleTitle: "Moduł 7 – Timing",
          order: 2,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m7-l3-wejscia-na-m5",
          title: "Wejścia na M5",
          module: "Moduł 7",
          moduleTitle: "Moduł 7 – Timing",
          order: 3,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m7-l4-potwierdzenie-wejscia",
          title: "Potwierdzenie wejścia",
          module: "Moduł 7",
          moduleTitle: "Moduł 7 – Timing",
          order: 4,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m7-l5-moment-impulsu",
          title: "Moment impulsu",
          module: "Moduł 7",
          moduleTitle: "Moduł 7 – Timing",
          order: 5,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m7-l6-idealny-moment-wejscia",
          title: "Idealny moment wejścia",
          module: "Moduł 7",
          moduleTitle: "Moduł 7 – Timing",
          order: 6,
          type: "lesson",
          minutes: 11,
        },
        {
          id: "m7-quiz-timing",
          title: "Quiz – Timing",
          module: "Moduł 7",
          moduleTitle: "Moduł 7 – Timing",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 8 – Liquidity",
      items: [
        {
          id: "m8-l1-czym-jest-liquidity",
          title: "Czym jest liquidity",
          module: "Moduł 8",
          moduleTitle: "Moduł 8 – Liquidity",
          order: 1,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m8-l2-gdzie-jest-liquidity",
          title: "Gdzie jest liquidity",
          module: "Moduł 8",
          moduleTitle: "Moduł 8 – Liquidity",
          order: 2,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m8-l3-liquidity-sweep",
          title: "Liquidity sweep",
          module: "Moduł 8",
          moduleTitle: "Moduł 8 – Liquidity",
          order: 3,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m8-l4-stop-hunt",
          title: "Stop hunt",
          module: "Moduł 8",
          moduleTitle: "Moduł 8 – Liquidity",
          order: 4,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m8-l5-equal-highs-lows",
          title: "Equal highs i equal lows",
          module: "Moduł 8",
          moduleTitle: "Moduł 8 – Liquidity",
          order: 5,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m8-l6-liquidity-w-praktyce",
          title: "Liquidity w praktyce",
          module: "Moduł 8",
          moduleTitle: "Moduł 8 – Liquidity",
          order: 6,
          type: "lesson",
          minutes: 11,
        },
        {
          id: "m8-quiz-liquidity",
          title: "Quiz – Liquidity",
          module: "Moduł 8",
          moduleTitle: "Moduł 8 – Liquidity",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 9 – Risk management",
      items: [
        {
          id: "m9-l1-co-to-jest-risk-management",
          title: "Co to jest risk management",
          module: "Moduł 9",
          moduleTitle: "Moduł 9 – Risk management",
          order: 1,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m9-l2-r-i-rr",
          title: "R i RR",
          module: "Moduł 9",
          moduleTitle: "Moduł 9 – Risk management",
          order: 2,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m9-l3-wielkosc-pozycji",
          title: "Wielkość pozycji",
          module: "Moduł 9",
          moduleTitle: "Moduł 9 – Risk management",
          order: 3,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m9-l4-ile-ryzykowac",
          title: "Ile ryzykować na trade",
          module: "Moduł 9",
          moduleTitle: "Moduł 9 – Risk management",
          order: 4,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m9-l5-zarzadzanie-seria-strat",
          title: "Zarządzanie serią strat",
          module: "Moduł 9",
          moduleTitle: "Moduł 9 – Risk management",
          order: 5,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m9-l6-jak-chronic-konto",
          title: "Jak chronić konto",
          module: "Moduł 9",
          moduleTitle: "Moduł 9 – Risk management",
          order: 6,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m9-quiz-risk-management",
          title: "Quiz – Risk management",
          module: "Moduł 9",
          moduleTitle: "Moduł 9 – Risk management",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 10 – Zarządzanie pozycją",
      items: [
        {
          id: "m10-l1-zarzadzanie-trade",
          title: "Zarządzanie trade",
          module: "Moduł 10",
          moduleTitle: "Moduł 10 – Zarządzanie pozycją",
          order: 1,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m10-l2-partial-tp",
          title: "Partial TP",
          module: "Moduł 10",
          moduleTitle: "Moduł 10 – Zarządzanie pozycją",
          order: 2,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m10-l3-trailing-stop",
          title: "Trailing stop",
          module: "Moduł 10",
          moduleTitle: "Moduł 10 – Zarządzanie pozycją",
          order: 3,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m10-l4-scaling-pozycji",
          title: "Scaling pozycji",
          module: "Moduł 10",
          moduleTitle: "Moduł 10 – Zarządzanie pozycją",
          order: 4,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m10-l5-kiedy-zamknac-trade",
          title: "Kiedy zamknąć trade",
          module: "Moduł 10",
          moduleTitle: "Moduł 10 – Zarządzanie pozycją",
          order: 5,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m10-l6-zarzadzanie-wygrana",
          title: "Zarządzanie wygraną",
          module: "Moduł 10",
          moduleTitle: "Moduł 10 – Zarządzanie pozycją",
          order: 6,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m10-quiz-zarzadzanie-pozycja",
          title: "Quiz – Zarządzanie pozycją",
          module: "Moduł 10",
          moduleTitle: "Moduł 10 – Zarządzanie pozycją",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 11 – Psychologia tradingu",
      items: [
        {
          id: "m11-l1-emocje-w-tradingu",
          title: "Emocje w tradingu",
          module: "Moduł 11",
          moduleTitle: "Moduł 11 – Psychologia tradingu",
          order: 1,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m11-l2-fomo",
          title: "FOMO",
          module: "Moduł 11",
          moduleTitle: "Moduł 11 – Psychologia tradingu",
          order: 2,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m11-l3-revenge-trading",
          title: "Revenge trading",
          module: "Moduł 11",
          moduleTitle: "Moduł 11 – Psychologia tradingu",
          order: 3,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m11-l4-overtrading",
          title: "Overtrading",
          module: "Moduł 11",
          moduleTitle: "Moduł 11 – Psychologia tradingu",
          order: 4,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m11-l5-strach-przed-strata",
          title: "Strach przed stratą",
          module: "Moduł 11",
          moduleTitle: "Moduł 11 – Psychologia tradingu",
          order: 5,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m11-l6-proces-vs-wynik",
          title: "Proces vs wynik",
          module: "Moduł 11",
          moduleTitle: "Moduł 11 – Psychologia tradingu",
          order: 6,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m11-quiz-psychologia-tradingu",
          title: "Quiz – Psychologia tradingu",
          module: "Moduł 11",
          moduleTitle: "Moduł 11 – Psychologia tradingu",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 12 – Rutyna tradera",
      items: [
        {
          id: "m12-l1-plan-dnia-tradera",
          title: "Plan dnia tradera",
          module: "Moduł 12",
          moduleTitle: "Moduł 12 – Rutyna tradera",
          order: 1,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m12-l2-analiza-przed-sesja",
          title: "Analiza rynku przed sesją",
          module: "Moduł 12",
          moduleTitle: "Moduł 12 – Rutyna tradera",
          order: 2,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m12-l3-przygotowanie-do-tradingu",
          title: "Przygotowanie do tradingu",
          module: "Moduł 12",
          moduleTitle: "Moduł 12 – Rutyna tradera",
          order: 3,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m12-l4-rutyna-tradingowa",
          title: "Rutyna tradingowa",
          module: "Moduł 12",
          moduleTitle: "Moduł 12 – Rutyna tradera",
          order: 4,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m12-l5-analiza-po-sesji",
          title: "Analiza po sesji",
          module: "Moduł 12",
          moduleTitle: "Moduł 12 – Rutyna tradera",
          order: 5,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m12-l6-dyscyplina",
          title: "Dyscyplina",
          module: "Moduł 12",
          moduleTitle: "Moduł 12 – Rutyna tradera",
          order: 6,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m12-quiz-rutyna-tradera",
          title: "Quiz – Rutyna tradera",
          module: "Moduł 12",
          moduleTitle: "Moduł 12 – Rutyna tradera",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 13 – Trading journal",
      items: [
        {
          id: "m13-l1-dlaczego-journal-jest-wazny",
          title: "Dlaczego journal jest ważny",
          module: "Moduł 13",
          moduleTitle: "Moduł 13 – Trading journal",
          order: 1,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m13-l2-jak-prowadzic-journal",
          title: "Jak prowadzić trading journal",
          module: "Moduł 13",
          moduleTitle: "Moduł 13 – Trading journal",
          order: 2,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m13-l3-co-zapisywac",
          title: "Co zapisywać w journal",
          module: "Moduł 13",
          moduleTitle: "Moduł 13 – Trading journal",
          order: 3,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m13-l4-analiza-trade",
          title: "Analiza trade",
          module: "Moduł 13",
          moduleTitle: "Moduł 13 – Trading journal",
          order: 4,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m13-l5-poprawa-wynikow",
          title: "Poprawa wyników",
          module: "Moduł 13",
          moduleTitle: "Moduł 13 – Trading journal",
          order: 5,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m13-l6-budowanie-statystyk",
          title: "Budowanie statystyk",
          module: "Moduł 13",
          moduleTitle: "Moduł 13 – Trading journal",
          order: 6,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m13-quiz-trading-journal",
          title: "Quiz – Trading journal",
          module: "Moduł 13",
          moduleTitle: "Moduł 13 – Trading journal",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 14 – Case study",
      items: [
        {
          id: "m14-l1-analiza-realnego-trade",
          title: "Analiza realnego trade",
          module: "Moduł 14",
          moduleTitle: "Moduł 14 – Case study",
          order: 1,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m14-l2-analiza-sesji-tradingowej",
          title: "Analiza sesji tradingowej",
          module: "Moduł 14",
          moduleTitle: "Moduł 14 – Case study",
          order: 2,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m14-l3-trade-krok-po-kroku",
          title: "Trade krok po kroku",
          module: "Moduł 14",
          moduleTitle: "Moduł 14 – Case study",
          order: 3,
          type: "lesson",
          minutes: 11,
        },
        {
          id: "m14-l4-bledy-w-trade",
          title: "Błędy w trade",
          module: "Moduł 14",
          moduleTitle: "Moduł 14 – Case study",
          order: 4,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m14-l5-poprawna-analiza",
          title: "Poprawna analiza",
          module: "Moduł 14",
          moduleTitle: "Moduł 14 – Case study",
          order: 5,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m14-l6-wnioski-z-trade",
          title: "Wnioski z trade",
          module: "Moduł 14",
          moduleTitle: "Moduł 14 – Case study",
          order: 6,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m14-quiz-case-study",
          title: "Quiz – Case study",
          module: "Moduł 14",
          moduleTitle: "Moduł 14 – Case study",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 15 – System tradingowy",
      items: [
        {
          id: "m15-l1-czym-jest-system",
          title: "Czym jest system tradingowy",
          module: "Moduł 15",
          moduleTitle: "Moduł 15 – System tradingowy",
          order: 1,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m15-l2-budowanie-strategii",
          title: "Budowanie strategii",
          module: "Moduł 15",
          moduleTitle: "Moduł 15 – System tradingowy",
          order: 2,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m15-l3-checklist-trade",
          title: "Checklist trade",
          module: "Moduł 15",
          moduleTitle: "Moduł 15 – System tradingowy",
          order: 3,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m15-l4-plan-tradingowy",
          title: "Plan tradingowy",
          module: "Moduł 15",
          moduleTitle: "Moduł 15 – System tradingowy",
          order: 4,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m15-l5-edge-tradera",
          title: "Edge tradera",
          module: "Moduł 15",
          moduleTitle: "Moduł 15 – System tradingowy",
          order: 5,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m15-l6-testowanie-strategii",
          title: "Testowanie strategii",
          module: "Moduł 15",
          moduleTitle: "Moduł 15 – System tradingowy",
          order: 6,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m15-quiz-system-tradingowy",
          title: "Quiz – System tradingowy",
          module: "Moduł 15",
          moduleTitle: "Moduł 15 – System tradingowy",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 16 – Statystyka tradingowa",
      items: [
        {
          id: "m16-l1-win-rate",
          title: "Win rate",
          module: "Moduł 16",
          moduleTitle: "Moduł 16 – Statystyka tradingowa",
          order: 1,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m16-l2-expectancy",
          title: "Expectancy",
          module: "Moduł 16",
          moduleTitle: "Moduł 16 – Statystyka tradingowa",
          order: 2,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m16-l3-edge-w-tradingu",
          title: "Edge w tradingu",
          module: "Moduł 16",
          moduleTitle: "Moduł 16 – Statystyka tradingowa",
          order: 3,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m16-l4-analiza-wynikow",
          title: "Analiza wyników",
          module: "Moduł 16",
          moduleTitle: "Moduł 16 – Statystyka tradingowa",
          order: 4,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m16-l5-backtesting",
          title: "Backtesting",
          module: "Moduł 16",
          moduleTitle: "Moduł 16 – Statystyka tradingowa",
          order: 5,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m16-l6-optymalizacja-strategii",
          title: "Optymalizacja strategii",
          module: "Moduł 16",
          moduleTitle: "Moduł 16 – Statystyka tradingowa",
          order: 6,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m16-quiz-statystyka-tradingowa",
          title: "Quiz – Statystyka tradingowa",
          module: "Moduł 16",
          moduleTitle: "Moduł 16 – Statystyka tradingowa",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 17 – Skalowanie konta",
      items: [
        {
          id: "m17-l1-jak-skalowac-konto",
          title: "Jak skalować konto",
          module: "Moduł 17",
          moduleTitle: "Moduł 17 – Skalowanie konta",
          order: 1,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m17-l2-zarzadzanie-wiekszym-kapitalem",
          title: "Zarządzanie większym kapitałem",
          module: "Moduł 17",
          moduleTitle: "Moduł 17 – Skalowanie konta",
          order: 2,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m17-l3-trading-w-prop-firmach",
          title: "Trading w prop firmach",
          module: "Moduł 17",
          moduleTitle: "Moduł 17 – Skalowanie konta",
          order: 3,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m17-l4-funded-account",
          title: "Funded account",
          module: "Moduł 17",
          moduleTitle: "Moduł 17 – Skalowanie konta",
          order: 4,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m17-l5-zarzadzanie-kapitalem",
          title: "Zarządzanie kapitałem",
          module: "Moduł 17",
          moduleTitle: "Moduł 17 – Skalowanie konta",
          order: 5,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m17-l6-profesjonalny-trading",
          title: "Profesjonalny trading",
          module: "Moduł 17",
          moduleTitle: "Moduł 17 – Skalowanie konta",
          order: 6,
          type: "lesson",
          minutes: 11,
        },
        {
          id: "m17-quiz-skalowanie-konta",
          title: "Quiz – Skalowanie konta",
          module: "Moduł 17",
          moduleTitle: "Moduł 17 – Skalowanie konta",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },

    {
      title: "Moduł 18 – Błędy traderów",
      items: [
        {
          id: "m18-l1-bledy-poczatkujacych",
          title: "Błędy początkujących",
          module: "Moduł 18",
          moduleTitle: "Moduł 18 – Błędy traderów",
          order: 1,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m18-l2-bledy-w-risk-management",
          title: "Błędy w risk management",
          module: "Moduł 18",
          moduleTitle: "Moduł 18 – Błędy traderów",
          order: 2,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m18-l3-bledy-psychologiczne",
          title: "Błędy psychologiczne",
          module: "Moduł 18",
          moduleTitle: "Moduł 18 – Błędy traderów",
          order: 3,
          type: "lesson",
          minutes: 9,
        },
        {
          id: "m18-l4-overtrading",
          title: "Overtrading",
          module: "Moduł 18",
          moduleTitle: "Moduł 18 – Błędy traderów",
          order: 4,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m18-l5-brak-planu",
          title: "Brak planu",
          module: "Moduł 18",
          moduleTitle: "Moduł 18 – Błędy traderów",
          order: 5,
          type: "lesson",
          minutes: 8,
        },
        {
          id: "m18-l6-jak-unikac-bledow",
          title: "Jak unikać błędów",
          module: "Moduł 18",
          moduleTitle: "Moduł 18 – Błędy traderów",
          order: 6,
          type: "lesson",
          minutes: 10,
        },
        {
          id: "m18-quiz-bledy-traderow",
          title: "Quiz – Błędy traderów",
          module: "Moduł 18",
          moduleTitle: "Moduł 18 – Błędy traderów",
          order: 7,
          type: "quiz",
          minutes: 5,
        },
      ],
    },
  ],
};

export const ALL_LESSONS: CourseLesson[] = COURSE.modules
  .flatMap((m) => m.items)
  .sort((a, b) => {
    const getModNum = (s: string) => Number(s.match(/\d+/)?.[0] ?? "0");
    const am = getModNum(a.module);
    const bm = getModNum(b.module);

    if (am !== bm) return am - bm;
    return a.order - b.order;
  });

export const ALL_LESSON_IDS_IN_ORDER: string[] = ALL_LESSONS.map((l) => l.id);

export const TOTAL_MODULES = COURSE.modules.length;
export const TOTAL_ITEMS = ALL_LESSONS.length;
export const TOTAL_LESSONS = ALL_LESSONS.filter(
  (item) => item.type === "lesson"
).length;
export const TOTAL_QUIZZES = ALL_LESSONS.filter(
  (item) => item.type === "quiz"
).length;

export function getLessonById(id: string) {
  return ALL_LESSONS.find((lesson) => lesson.id === id) ?? null;
}

export function getModuleByLessonId(id: string) {
  return COURSE.modules.find((module) =>
    module.items.some((item) => item.id === id)
  ) ?? null;
}

export function getNextLessonId(currentId: string) {
  const index = ALL_LESSON_IDS_IN_ORDER.indexOf(currentId);
  if (index === -1) return null;
  return ALL_LESSON_IDS_IN_ORDER[index + 1] ?? null;
}

export function getPrevLessonId(currentId: string) {
  const index = ALL_LESSON_IDS_IN_ORDER.indexOf(currentId);
  if (index === -1) return null;
  return ALL_LESSON_IDS_IN_ORDER[index - 1] ?? null;
}

export function isQuiz(item: CourseLesson) {
  return item.type === "quiz";
}

export function isLesson(item: CourseLesson) {
  return item.type === "lesson";
}

export function getModuleProgress(
  moduleTitle: string,
  completedIds: string[]
): {
  total: number;
  completed: number;
  percent: number;
} {
  const module = COURSE.modules.find((m) => m.title === moduleTitle);

  if (!module) {
    return { total: 0, completed: 0, percent: 0 };
  }

  const total = module.items.length;
  const completed = module.items.filter((item) =>
    completedIds.includes(item.id)
  ).length;

  return {
    total,
    completed,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}