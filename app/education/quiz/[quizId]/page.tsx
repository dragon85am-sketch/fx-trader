"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QUIZ_CONTENT } from "@/components/QuizContent";

const QUIZ_TO_MODULE_MAP: Record<string, string> = {
  "m0-quiz-podstawy-tradingu": "0",
  "m1-quiz-platforma-tradingowa": "1",
  "m2-quiz-wykresy-timeframe": "2",
  "m3-quiz-struktura-rynku": "3",
  "m4-quiz-trend": "4",
  "m5-quiz-price-action": "5",
  "m6-quiz-setup-tradingowy": "6",
  "m7-quiz-timing": "7",
  "m8-quiz-liquidity": "8",
  "m9-quiz-risk-management": "9",
  "m10-quiz-zarzadzanie-pozycja": "10",
  "m11-quiz-psychologia-tradingu": "11",
  "m12-quiz-rutyna-tradera": "12",
  "m13-quiz-trading-journal": "13",
  "m14-quiz-case-study": "14",
  "m15-quiz-system-tradingowy": "15",
  "m16-quiz-statystyka-tradingowa": "16",
  "m17-quiz-skalowanie-konta": "17",
  "m18-quiz-bledy-traderow": "18",
};

export default function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);

  const router = useRouter();
  const quiz = QUIZ_CONTENT[quizId];

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    if (!quiz) {
      return {
        correct: 0,
        total: 0,
        percent: 0,
        passed: false,
      };
    }

    const correct = quiz.questions.reduce((acc, q) => {
      return acc + (answers[q.id] === q.correctIndex ? 1 : 0);
    }, 0);

    const total = quiz.questions.length;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = percent >= quiz.passPercent;

    return {
      correct,
      total,
      percent,
      passed,
    };
  }, [answers, quiz]);

  if (!quiz) {
    return (
      <div className="p-10">
        <h1 className="text-3xl font-bold text-white mb-4">
          Quiz nie został znaleziony
        </h1>

        <p className="text-gray-400 mb-6">ID: {quizId}</p>

        <Link
          href="/education/kurs"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
        >
          Wróć do kursu
        </Link>
      </div>
    );
  }

  const currentModule = Number(QUIZ_TO_MODULE_MAP[quizId] ?? "0");
  const hasNextModule = currentModule < 18;
  const nextModule = currentModule + 1;

  const handleSelect = (
    questionId: string,
    optionIndex: number
  ) => {
    if (submitted) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = () => {
    setSubmitted(true);

    if (!score.passed) return;

    const passedQuizzes = JSON.parse(
      localStorage.getItem("passedQuizzes") || "{}"
    );

    passedQuizzes[quizId] = true;

    localStorage.setItem(
      "passedQuizzes",
      JSON.stringify(passedQuizzes)
    );

    localStorage.setItem(
      `module-${currentModule}-activeLesson`,
      "0"
    );

    if (hasNextModule) {
      localStorage.setItem(
        "lastOpenedModule",
        String(nextModule)
      );

      localStorage.setItem(
        `module-${nextModule}-activeLesson`,
        "0"
      );

      setTimeout(() => {
        router.push(`/education/kurs/${nextModule}`);
      }, 800);
    } else {
      localStorage.setItem(
        "lastOpenedModule",
        String(currentModule)
      );

      setTimeout(() => {
        router.push("/education/kurs/koniec");
      }, 800);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const allAnswered = quiz.questions.every(
    (q) => answers[q.id] !== undefined
  );

  return (
    <div className="p-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {quiz.title}
        </h1>

        <p className="text-gray-400">
          Aby zaliczyć quiz potrzebujesz {quiz.passPercent}% poprawnych
          odpowiedzi
        </p>
      </div>

      {submitted && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl text-white mb-2">
            Wynik: {score.correct}/{score.total} ({score.percent}%)
          </h2>

          {score.passed ? (
            <p className="text-green-400 font-medium">
              {hasNextModule
                ? "Quiz zaliczony — przejście do następnego modułu..."
                : "Quiz zaliczony — ukończyłeś cały kurs..."}
            </p>
          ) : (
            <p className="text-red-400 font-medium">
              Quiz niezaliczony
            </p>
          )}
        </div>
      )}

      {quiz.questions.map((question, index) => {
        const selected = answers[question.id];

        return (
          <div
            key={question.id}
            className="bg-white/5 border border-white/10 rounded-xl p-6"
          >
            <h2 className="text-white font-semibold mb-4">
              {index + 1}. {question.question}
            </h2>

            <div className="space-y-3">
              {question.options.map((option, optionIndex) => {
                const isSelected = selected === optionIndex;
                const isCorrect =
                  question.correctIndex === optionIndex;

                let style =
                  "border border-white/10 bg-black/20 text-gray-300";

                if (!submitted && isSelected) {
                  style =
                    "border-blue-500 bg-blue-600/20 text-white";
                }

                if (submitted && isCorrect) {
                  style =
                    "border-green-500 bg-green-600/20 text-white";
                }

                if (
                  submitted &&
                  isSelected &&
                  !isCorrect
                ) {
                  style =
                    "border-red-500 bg-red-600/20 text-white";
                }

                return (
                  <button
                    key={optionIndex}
                    type="button"
                    onClick={() =>
                      handleSelect(
                        question.id,
                        optionIndex
                      )
                    }
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${style}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {submitted && question.explanation && (
              <div className="mt-4 text-sm text-gray-400">
                <b>Wyjaśnienie:</b>{" "}
                {question.explanation}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex gap-4 flex-wrap">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || submitted}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Sprawdź wynik
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg"
        >
          Resetuj quiz
        </button>

        <Link
          href={`/education/kurs/${currentModule}`}
          className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg"
        >
          Wróć do modułu
        </Link>
      </div>
    </div>
  );
}