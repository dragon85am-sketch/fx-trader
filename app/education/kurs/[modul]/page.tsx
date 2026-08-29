"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LESSON_CONTENT } from "@/components/LessonContent";

type LessonMeta = {
  title: string;
  time: string;
  contentKey?: string;
  quizKey?: string;
};

type ModuleData = {
  title: string;
  lessons: LessonMeta[];
};

const COURSE_DATA: Record<string, ModuleData> = {
  "0": {
    title: "Moduł 0 – Podstawy tradingu",
    lessons: [
      { title: "1. Czym jest trading", time: "8 min", contentKey: "m0-l1-czym-jest-trading" },
      { title: "2. Jak działa rynek Forex", time: "10 min", contentKey: "m0-l2-jak-dziala-rynek-forex" },
      { title: "3. Pips, lot, spread", time: "10 min", contentKey: "m0-l3-pips-lot-spread" },
      { title: "4. Rodzaje rynków", time: "9 min", contentKey: "m0-l4-rodzaje-rynkow" },
      { title: "5. Jak działa broker", time: "8 min", contentKey: "m0-l5-jak-dziala-broker" },
      { title: "6. Jak powstaje cena", time: "9 min", contentKey: "m0-l6-jak-powstaje-cena" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m0-quiz-podstawy-tradingu" },
    ],
  },

  "1": {
    title: "Moduł 1 – Platforma tradingowa",
    lessons: [
      { title: "1. TradingView — podstawy", time: "8 min", contentKey: "m1-l1-tradingview-podstawy" },
      { title: "2. MT4 / MT5", time: "10 min", contentKey: "m1-l2-mt4-mt5" },
      { title: "3. Jak otworzyć trade", time: "8 min", contentKey: "m1-l3-jak-otworzyc-trade" },
      { title: "4. Stop Loss i Take Profit", time: "8 min", contentKey: "m1-l4-stop-loss-take-profit" },
      { title: "5. Typy zleceń", time: "8 min", contentKey: "m1-l5-typy-zlecen" },
      { title: "6. Zarządzanie pozycją", time: "8 min", contentKey: "m1-l6-zarzadzanie-pozycja" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m1-quiz-platforma-tradingowa" },
    ],
  },

  "2": {
    title: "Moduł 2 – Wykresy i timeframe",
    lessons: [
      { title: "1. Typy wykresów", time: "8 min", contentKey: "m2-l1-typy-wykresow" },
      { title: "2. Timeframe", time: "8 min", contentKey: "m2-l2-timeframe" },
      { title: "3. Świece japońskie", time: "8 min", contentKey: "m2-l3-swiece-japonskie" },
      { title: "4. Jak czytać świece", time: "8 min", contentKey: "m2-l4-jak-czytac-swiece" },
      { title: "5. Struktura świecy", time: "8 min", contentKey: "m2-l5-struktura-swiecy" },
      { title: "6. Momentum świec", time: "8 min", contentKey: "m2-l6-momentum-swiec" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m2-quiz-wykresy-timeframe" },
    ],
  },

  "3": {
    title: "Moduł 3 – Struktura rynku",
    lessons: [
      { title: "1. HH / HL vs LH / LL", time: "8 min", contentKey: "m3-l1-hh-hl-lh-ll" },
      { title: "2. Jak rozpoznać trend", time: "8 min", contentKey: "m3-l2-jak-rozpoznac-trend" },
      { title: "3. Zmiana struktury", time: "8 min", contentKey: "m3-l3-zmiana-struktury" },
      { title: "4. BOS", time: "8 min", contentKey: "m3-l4-bos" },
      { title: "5. CHoCH", time: "8 min", contentKey: "m3-l5-choch" },
      { title: "6. Struktura w praktyce", time: "8 min", contentKey: "m3-l6-struktura-w-praktyce" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m3-quiz-struktura-rynku" },
    ],
  },

  "4": {
    title: "Moduł 4 – Trend",
    lessons: [
      { title: "1. Co to jest trend", time: "8 min", contentKey: "m4-l1-co-to-jest-trend" },
      { title: "2. Trend vs konsolidacja", time: "8 min", contentKey: "m4-l2-trend-vs-konsolidacja" },
      { title: "3. Jak określić bias", time: "8 min", contentKey: "m4-l3-jak-okreslic-bias" },
      { title: "4. Kiedy nie handlować", time: "8 min", contentKey: "m4-l4-kiedy-nie-handlowac" },
      { title: "5. Trend na różnych timeframe", time: "8 min", contentKey: "m4-l5-trend-na-roznych-timeframe" },
      { title: "6. Multi Timeframe Analysis", time: "8 min", contentKey: "m4-l6-multi-timeframe-analysis" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m4-quiz-trend" },
    ],
  },

  "5": {
    title: "Moduł 5 – Price Action",
    lessons: [
      { title: "1. Podstawy price action", time: "8 min", contentKey: "m5-l1-podstawy-price-action" },
      { title: "2. Momentum ceny", time: "8 min", contentKey: "m5-l2-momentum-ceny" },
      { title: "3. Pin bar", time: "8 min", contentKey: "m5-l3-pin-bar" },
      { title: "4. Engulfing", time: "8 min", contentKey: "m5-l4-engulfing" },
      { title: "5. Fake breakout", time: "8 min", contentKey: "m5-l5-fake-breakout" },
      { title: "6. Price action w praktyce", time: "8 min", contentKey: "m5-l6-price-action-w-praktyce" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m5-quiz-price-action" },
    ],
  },

  "6": {
    title: "Moduł 6 – Setup tradingowy",
    lessons: [
      { title: "1. Co to jest setup", time: "8 min", contentKey: "m6-l1-co-to-jest-setup" },
      { title: "2. Setup 1-2-3", time: "8 min", contentKey: "m6-l2-setup-1-2-3" },
      { title: "3. Breakout", time: "8 min", contentKey: "m6-l3-breakout" },
      { title: "4. Retest", time: "8 min", contentKey: "m6-l4-retest" },
      { title: "5. Fałszywe wybicie", time: "8 min", contentKey: "m6-l5-falszywe-wybicie" },
      { title: "6. Checklist setupu", time: "8 min", contentKey: "m6-l6-checklist-setupu" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m6-quiz-setup-tradingowy" },
    ],
  },

  "7": {
    title: "Moduł 7 – Timing",
    lessons: [
      { title: "1. Timing wejścia", time: "8 min", contentKey: "m7-l1-timing-wejscia" },
      { title: "2. Wejścia na M1", time: "8 min", contentKey: "m7-l2-wejscia-na-m1" },
      { title: "3. Wejścia na M5", time: "8 min", contentKey: "m7-l3-wejscia-na-m5" },
      { title: "4. Potwierdzenie wejścia", time: "8 min", contentKey: "m7-l4-potwierdzenie-wejscia" },
      { title: "5. Moment impulsu", time: "8 min", contentKey: "m7-l5-moment-impulsu" },
      { title: "6. Idealny moment wejścia", time: "8 min", contentKey: "m7-l6-idealny-moment-wejscia" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m7-quiz-timing" },
    ],
  },

  "8": {
    title: "Moduł 8 – Liquidity",
    lessons: [
      { title: "1. Czym jest liquidity", time: "8 min", contentKey: "m8-l1-czym-jest-liquidity" },
      { title: "2. Gdzie jest liquidity", time: "8 min", contentKey: "m8-l2-gdzie-jest-liquidity" },
      { title: "3. Liquidity sweep", time: "8 min", contentKey: "m8-l3-liquidity-sweep" },
      { title: "4. Stop hunt", time: "8 min", contentKey: "m8-l4-stop-hunt" },
      { title: "5. Equal highs / lows", time: "8 min", contentKey: "m8-l5-equal-highs-lows" },
      { title: "6. Liquidity w praktyce", time: "8 min", contentKey: "m8-l6-liquidity-w-praktyce" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m8-quiz-liquidity" },
    ],
  },

  "9": {
    title: "Moduł 9 – Risk management",
    lessons: [
      { title: "1. Co to jest risk management", time: "8 min", contentKey: "m9-l1-co-to-jest-risk-management" },
      { title: "2. Zarządzanie pozycją i ryzykiem", time: "8 min", contentKey: "m9-l2-zarzadzanie-pozycja" },
      { title: "3. Wielkość pozycji", time: "8 min", contentKey: "m9-l3-wielkosc-pozycji" },
      { title: "4. Ile ryzykować", time: "8 min", contentKey: "m9-l4-ile-ryzykowac" },
      { title: "5. Seria strat", time: "8 min", contentKey: "m9-l5-zarzadzanie-seria-strat" },
      { title: "6. Jak chronić konto", time: "8 min", contentKey: "m9-l6-jak-chronic-konto" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m9-quiz-risk-management" },
    ],
  },

  "10": {
    title: "Moduł 10 – Zarządzanie pozycją",
    lessons: [
      { title: "1. Zarządzanie trade", time: "8 min", contentKey: "m10-l1-zarzadzanie-trade" },
      { title: "2. Partial TP", time: "8 min", contentKey: "m10-l2-partial-tp" },
      { title: "3. Trailing stop", time: "8 min", contentKey: "m10-l3-trailing-stop" },
      { title: "4. Scaling pozycji", time: "8 min", contentKey: "m10-l4-scaling-pozycji" },
      { title: "5. Kiedy zamknąć trade", time: "8 min", contentKey: "m10-l5-kiedy-zamknac-trade" },
      { title: "6. Zarządzanie wygraną", time: "8 min", contentKey: "m10-l6-zarzadzanie-wygrana" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m10-quiz-zarzadzanie-pozycja" },
    ],
  },

  "11": {
    title: "Moduł 11 – Psychologia tradingu",
    lessons: [
      { title: "1. Emocje w tradingu", time: "8 min", contentKey: "m11-l1-emocje-w-tradingu" },
      { title: "2. FOMO", time: "8 min", contentKey: "m11-l2-fomo" },
      { title: "3. Revenge trading", time: "8 min", contentKey: "m11-l3-revenge-trading" },
      { title: "4. Overtrading", time: "8 min", contentKey: "m11-l4-overtrading" },
      { title: "5. Strach przed stratą", time: "8 min", contentKey: "m11-l5-strach-przed-strata" },
      { title: "6. Proces vs wynik", time: "8 min", contentKey: "m11-l6-proces-vs-wynik" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m11-quiz-psychologia-tradingu" },
    ],
  },

  "12": {
    title: "Moduł 12 – Rutyna tradera",
    lessons: [
      { title: "1. Plan dnia tradera", time: "8 min", contentKey: "m12-l1-plan-dnia-tradera" },
      { title: "2. Analiza przed sesją", time: "8 min", contentKey: "m12-l2-analiza-przed-sesja" },
      { title: "3. Przygotowanie do tradingu", time: "8 min", contentKey: "m12-l3-przygotowanie-do-tradingu" },
      { title: "4. Rutyna tradingowa", time: "8 min", contentKey: "m12-l4-rutyna-tradingowa" },
      { title: "5. Analiza po sesji", time: "8 min", contentKey: "m12-l5-analiza-po-sesji" },
      { title: "6. Dyscyplina", time: "8 min", contentKey: "m12-l6-dyscyplina" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m12-quiz-rutyna-tradera" },
    ],
  },

  "13": {
    title: "Moduł 13 – Trading journal",
    lessons: [
      { title: "1. Dlaczego journal jest ważny", time: "8 min", contentKey: "m13-l1-dlaczego-journal-jest-wazny" },
      { title: "2. Jak prowadzić journal", time: "8 min", contentKey: "m13-l2-jak-prowadzic-journal" },
      { title: "3. Co zapisywać", time: "8 min", contentKey: "m13-l3-co-zapisywac" },
      { title: "4. Analiza trade", time: "8 min", contentKey: "m13-l4-analiza-trade" },
      { title: "5. Poprawa wyników", time: "8 min", contentKey: "m13-l5-poprawa-wynikow" },
      { title: "6. Budowanie statystyk", time: "8 min", contentKey: "m13-l6-budowanie-statystyk" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m13-quiz-trading-journal" },
    ],
  },

  "14": {
    title: "Moduł 14 – Case study",
    lessons: [
      { title: "1. Analiza realnego trade", time: "8 min", contentKey: "m14-l1-analiza-realnego-trade" },
      { title: "2. Analiza sesji tradingowej", time: "8 min", contentKey: "m14-l2-analiza-sesji-tradingowej" },
      { title: "3. Trade krok po kroku", time: "8 min", contentKey: "m14-l3-trade-krok-po-kroku" },
      { title: "4. Błędy w trade", time: "8 min", contentKey: "m14-l4-bledy-w-trade" },
      { title: "5. Poprawna analiza", time: "8 min", contentKey: "m14-l5-poprawna-analiza" },
      { title: "6. Wnioski z trade", time: "8 min", contentKey: "m14-l6-wnioski-z-trade" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m14-quiz-case-study" },
    ],
  },

  "15": {
    title: "Moduł 15 – System tradingowy",
    lessons: [
      { title: "1. Czym jest system", time: "8 min", contentKey: "m15-l1-czym-jest-system" },
      { title: "2. Budowanie strategii", time: "8 min", contentKey: "m15-l2-budowanie-strategii" },
      { title: "3. Checklist trade", time: "8 min", contentKey: "m15-l3-checklist-trade" },
      { title: "4. Plan tradingowy", time: "8 min", contentKey: "m15-l4-plan-tradingowy" },
      { title: "5. Edge tradera", time: "8 min", contentKey: "m15-l5-edge-tradera" },
      { title: "6. Testowanie strategii", time: "8 min", contentKey: "m15-l6-testowanie-strategii" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m15-quiz-system-tradingowy" },
    ],
  },

  "16": {
    title: "Moduł 16 – Statystyka tradingowa",
    lessons: [
      { title: "1. Win rate", time: "8 min", contentKey: "m16-l1-win-rate" },
      { title: "2. Expectancy", time: "8 min", contentKey: "m16-l2-expectancy" },
      { title: "3. Edge w tradingu", time: "8 min", contentKey: "m16-l3-edge-w-tradingu" },
      { title: "4. Analiza wyników", time: "8 min", contentKey: "m16-l4-analiza-wynikow" },
      { title: "5. Backtesting", time: "8 min", contentKey: "m16-l5-backtesting" },
      { title: "6. Optymalizacja strategii", time: "8 min", contentKey: "m16-l6-optymalizacja-strategii" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m16-quiz-statystyka-tradingowa" },
    ],
  },

  "17": {
    title: "Moduł 17 – Skalowanie konta",
    lessons: [
      { title: "1. Jak skalować konto", time: "8 min", contentKey: "m17-l1-jak-skalowac-konto" },
      { title: "2. Zarządzanie większym kapitałem", time: "8 min", contentKey: "m17-l2-zarzadzanie-wiekszym-kapitalem" },
      { title: "3. Trading w prop firmach", time: "8 min", contentKey: "m17-l3-trading-w-prop-firmach" },
      { title: "4. Funded account", time: "8 min", contentKey: "m17-l4-funded-account" },
      { title: "5. Zarządzanie kapitałem", time: "8 min", contentKey: "m17-l5-zarzadzanie-kapitalem" },
      { title: "6. Profesjonalny trading", time: "8 min", contentKey: "m17-l6-profesjonalny-trading" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m17-quiz-skalowanie-konta" },
    ],
  },

  "18": {
    title: "Moduł 18 – Błędy traderów",
    lessons: [
      { title: "1. Błędy początkujących", time: "8 min", contentKey: "m18-l1-bledy-poczatkujacych" },
      { title: "2. Błędy w risk management", time: "8 min", contentKey: "m18-l2-bledy-w-risk-management" },
      { title: "3. Błędy psychologiczne", time: "8 min", contentKey: "m18-l3-bledy-psychologiczne" },
      { title: "4. Overtrading", time: "8 min", contentKey: "m18-l4-overtrading" },
      { title: "5. Brak planu", time: "8 min", contentKey: "m18-l5-brak-planu" },
      { title: "6. Jak unikać błędów", time: "8 min", contentKey: "m18-l6-jak-unikac-bledow" },
      { title: "7. Quiz modułowy", time: "Quiz", quizKey: "m18-quiz-bledy-traderow" },
    ],
  },
};

function renderLessonBlock(block: any, index: number) {
  switch (block.type) {
    case "h2":
      return (
        <h2 key={index} className="text-2xl font-semibold text-white mt-8 mb-4">
          {block.text}
        </h2>
      );

    case "p":
      return (
        <p key={index} className="text-gray-300 leading-7 mb-4">
          {block.text}
        </p>
      );

    case "bullets":
      return (
        <ul key={index} className="list-disc pl-6 space-y-2 text-gray-300 mb-6">
          {block.items.map((item: string, itemIndex: number) => (
            <li key={itemIndex}>{item}</li>
          ))}
        </ul>
      );

    case "quote":
      return (
        <blockquote
          key={index}
          className="border-l-4 border-blue-500 bg-white/5 px-5 py-4 rounded-r-lg text-blue-200 italic mb-6"
        >
          {block.text}
        </blockquote>
      );

    case "checklist":
      return (
        <div key={index} className="space-y-3 mb-6">
          {block.items.map(
            (item: { text: string; checked?: boolean }, itemIndex: number) => (
              <div
                key={itemIndex}
                className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="mt-0.5 text-green-400">✓</div>
                <span className="text-gray-200">{item.text}</span>
              </div>
            )
          )}
        </div>
      );

    case "cta":
      return (
        <div
          key={index}
          className="rounded-xl border border-blue-500/30 bg-blue-600/10 px-5 py-4 text-blue-100 font-medium mt-6"
        >
          {block.text}
        </div>
      );

    case "video":
      return (
        <div key={index} className="mb-6">
          <div className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/30">
            <iframe
              className="w-full h-full"
              src={
                block.provider === "youtube"
                  ? `https://www.youtube.com/embed/${block.id}`
                  : `https://player.vimeo.com/video/${block.id}`
              }
              title={block.title || "Video lesson"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}

export default function ModulPage({
  params,
}: {
  params: Promise<{ modul: string }>;
}) {
  const { modul } = use(params);
  const router = useRouter();

  const moduleData = useMemo(() => COURSE_DATA[modul], [modul]);

  const [activeLesson, setActiveLesson] = useState(0);

  const [passedQuizzes, setPassedQuizzes] = useState<Record<string, boolean>>(
    {}
  );

  const [completedLessons, setCompletedLessons] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const savedCompleted = JSON.parse(
      localStorage.getItem("completedLessons") || "{}"
    );
    setCompletedLessons(savedCompleted);
  }, []);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("passedQuizzes") || "{}");
    setPassedQuizzes(saved);
  }, []);

  useEffect(() => {
    const savedIndex = localStorage.getItem(
      `module-${modul}-activeLesson`
    );

    if (savedIndex !== null) {
      setActiveLesson(Number(savedIndex));
    } else {
      setActiveLesson(0);
    }
  }, [modul]);

  useEffect(() => {
    localStorage.setItem(
      `module-${modul}-activeLesson`,
      String(activeLesson)
    );
  }, [modul, activeLesson]);

  useEffect(() => {
    localStorage.setItem("lastOpenedModule", modul);
  }, [modul]);

  if (!moduleData) {
    return (
      <div className="p-10">
        <h1 className="text-3xl font-bold text-white mb-4">
          Moduł nie istnieje
        </h1>
        <Link
          href="/education/kurs"
          className="text-blue-400 hover:text-blue-300"
        >
          Wróć do kursu
        </Link>
      </div>
    );
  }

  const active = moduleData.lessons[activeLesson];
  const isQuizLesson = active.time === "Quiz";
  const quizPassed =
    isQuizLesson && active.quizKey ? !!passedQuizzes[active.quizKey] : false;

  const currentModuleNumber = Number(modul);
  const hasNextModule = currentModuleNumber < 18;
  const nextModuleHref = `/education/kurs/${currentModuleNumber + 1}`;
  const isLastLesson = activeLesson === moduleData.lessons.length - 1;

  const currentLessonNumber = activeLesson + 1;
  const totalLessons = moduleData.lessons.length;
  const moduleProgressPercent = Math.round(
    (currentLessonNumber / totalLessons) * 100
  );

  const lessonContent =
    !isQuizLesson && active.contentKey ? LESSON_CONTENT[active.contentKey] : null;

  const activeLessonStorageKey =
    active.contentKey || active.quizKey || `${modul}-${activeLesson}`;

  const markLessonAsCompleted = () => {
    const updated = {
      ...completedLessons,
      [activeLessonStorageKey]: true,
    };

    setCompletedLessons(updated);
    localStorage.setItem("completedLessons", JSON.stringify(updated));
  };

  const goNext = () => {
    if (!isLastLesson) {
      if (!isQuizLesson) {
        const updated = {
          ...completedLessons,
          [activeLessonStorageKey]: true,
        };
        setCompletedLessons(updated);
        localStorage.setItem("completedLessons", JSON.stringify(updated));
      }

      setActiveLesson((prev) => prev + 1);
      return;
    }

    if (isQuizLesson && quizPassed) {
      if (hasNextModule) {
        localStorage.setItem(`module-${currentModuleNumber}-activeLesson`, "0");
        localStorage.setItem(
          "lastOpenedModule",
          String(currentModuleNumber + 1)
        );
        localStorage.setItem(
          `module-${currentModuleNumber + 1}-activeLesson`,
          "0"
        );
        router.push(nextModuleHref);
      } else {
        router.push("/education/kurs/koniec");
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-80 shrink-0 border-r border-white/10 bg-black/20 p-6 overflow-y-auto">
        <Link
          href="/education/kurs"
          className="text-blue-400 hover:text-blue-300 mb-6 inline-block"
        >
          ← Wróć do kursu
        </Link>

        <h2 className="text-xl font-semibold text-white mb-6">
          {moduleData.title}
        </h2>

        <div className="space-y-3">
          {moduleData.lessons.map((lesson, index) => {
            const lessonQuizPassed =
              lesson.time === "Quiz" && lesson.quizKey
                ? !!passedQuizzes[lesson.quizKey]
                : false;

            const lessonKey =
              lesson.contentKey || lesson.quizKey || `${modul}-${index}`;

            const lessonCompleted = !!completedLessons[lessonKey];
            const isActiveLesson = activeLesson === index;

            let statusIcon = "○";
            if (lessonQuizPassed) statusIcon = "🏁";
            else if (isActiveLesson) statusIcon = "▶";
            else if (lessonCompleted) statusIcon = "✓";

            return (
              <button
                key={index}
                onClick={() => setActiveLesson(index)}
                className={`w-full text-left p-4 rounded-lg border transition ${
                  isActiveLesson
                    ? "bg-blue-600/20 border-blue-500"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 text-sm ${
                      lessonQuizPassed
                        ? "text-green-400"
                        : isActiveLesson
                        ? "text-blue-400"
                        : lessonCompleted
                        ? "text-green-400"
                        : "text-gray-500"
                    }`}
                  >
                    {statusIcon}
                  </div>

                  <div className="min-w-0">
                    <p className="text-white">{lesson.title}</p>
                    <p className="text-xs text-gray-400">
                      {lesson.time}
                      {lessonQuizPassed ? " • zaliczony" : ""}
                      {!lessonQuizPassed && lessonCompleted ? " • ukończona" : ""}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 p-10">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="mb-6">
            <h1 className="text-3xl text-white mb-3">{active.title}</h1>

            <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
              <p className="text-sm text-gray-300">
                Lekcja {currentLessonNumber} z {totalLessons}
              </p>

              <p className="text-sm text-gray-400">
                Postęp modułu: {moduleProgressPercent}%
              </p>
            </div>

            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${moduleProgressPercent}%` }}
              />
            </div>
          </div>

{!isQuizLesson && (
  <div className="aspect-video max-w-3xl mx-auto bg-black/30 rounded-xl overflow-hidden mb-8 border border-white/10">
    <iframe
      className="w-full h-full"
      src={
  active.contentKey === "m0-l1-czym-jest-trading"
    ? "https://www.youtube.com/embed/NoMn8C2XtAc"
    : active.contentKey === "m0-l2-jak-dziala-rynek-forex"
    ? "https://www.youtube.com/embed/qOMj6UxLWc0"
    : active.contentKey === "m0-l3-pips-lot-spread"
    ? "https://www.youtube.com/embed/2exu03NGHqI"
    : active.contentKey === "m0-l4-rodzaje-rynkow"
    ? "https://www.youtube.com/embed/1y8EpwDbs0g"
    : active.contentKey === "m0-l5-jak-dziala-broker"
    ? "https://www.youtube.com/embed/UJ-DPccUUhU"
    : active.contentKey === "m0-l6-jak-powstaje-cena"
    ? "https://www.youtube.com/embed/kUR5Fgx67IY"
    : ""
}
      title="Video lekcji"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
)}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Treść lekcji
            </h3>

            {isQuizLesson ? (
              <div className="space-y-4">
                {quizPassed && (
                  <div className="rounded-lg bg-green-600/20 border border-green-500/40 p-4 text-green-300">
                    Quiz został już zaliczony.
                  </div>
                )}

                <Link
                  href={`/education/quiz/${active.quizKey}`}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white inline-block"
                >
                  {quizPassed ? "Otwórz quiz ponownie" : "Rozpocznij quiz"}
                </Link>
              </div>
            ) : lessonContent ? (
              <div>
                {lessonContent.blocks.map((block, index) =>
                  renderLessonBlock(block, index)
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 text-yellow-200">
                Nie znaleziono treści lekcji dla klucza:{" "}
                <span className="font-semibold">{active.contentKey}</span>
              </div>
            )}

            {!isQuizLesson && (
              <div className="mt-6">
                <button
                  onClick={markLessonAsCompleted}
                  className="px-5 py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white"
                >
                  Oznacz lekcję jako ukończoną
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-8 gap-4">
            <button
              onClick={() => setActiveLesson((prev) => Math.max(prev - 1, 0))}
              disabled={activeLesson === 0}
              className="px-5 py-3 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-40"
            >
              Poprzednia lekcja
            </button>

            <button
              onClick={goNext}
              disabled={isLastLesson ? !(isQuizLesson && quizPassed) : false}
              className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40"
            >
              {isLastLesson
                ? isQuizLesson && quizPassed
                  ? hasNextModule
                    ? "Przejdź do następnego modułu"
                    : "Ukończ kurs"
                  : "Najpierw zalicz quiz"
                : "Następna lekcja"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}