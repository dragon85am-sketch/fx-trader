// components/CourseQuiz.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { QUIZ_CONTENT } from "@/components/QuizContent";
import {
  emitCourseProgressChanged,
  markLessonCompleted,
} from "@/components/courseProgress";
import { getNextLessonId } from "@/components/course";

export default function CourseQuiz({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const quiz = QUIZ_CONTENT[lessonId];

  const [answers, setAnswers] = React.useState<number[]>([]);
  const [submitted, setSubmitted] = React.useState(false);
  const [passedOnce, setPassedOnce] = React.useState(false);

  if (!quiz) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-zinc-400">
        Quiz nie został znaleziony dla ID:{" "}
        <span className="text-zinc-200">{lessonId}</span>
      </div>
    );
  }

  const allAnswered = answers.length === quiz.questions.length &&
    quiz.questions.every((_, index) => typeof answers[index] === "number");

  function selectAnswer(questionIndex: number, optionIndex: number) {
    if (submitted) return;

    const next = [...answers];
    next[questionIndex] = optionIndex;
    setAnswers(next);
  }

  function calculateScore() {
    let correct = 0;

    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctIndex) {
        correct++;
      }
    });

    return Math.round((correct / quiz.questions.length) * 100);
  }

  function handleSubmit() {
    if (!allAnswered) return;

    setSubmitted(true);

    const scoreNow = (() => {
      let correct = 0;

      quiz.questions.forEach((question, index) => {
        if (answers[index] === question.correctIndex) {
          correct++;
        }
      });

      return Math.round((correct / quiz.questions.length) * 100);
    })();

    if (scoreNow >= quiz.passPercent) {
      markLessonCompleted(lessonId);
      emitCourseProgressChanged();
      setPassedOnce(true);
    }
  }

  function resetQuiz() {
    setAnswers([]);
    setSubmitted(false);
  }

  function handleContinue() {
    const nextLessonId = getNextLessonId(lessonId);

    if (nextLessonId) {
      router.push(`/education/kurs/${nextLessonId}`);
      return;
    }

    router.push("/education/kurs");
  }

  const score = submitted ? calculateScore() : 0;
  const passed = score >= quiz.passPercent;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">{quiz.title}</h2>
        <div className="mt-2 text-sm text-zinc-400">
          Aby zaliczyć quiz, musisz uzyskać minimum {quiz.passPercent}%.
        </div>
      </div>

      {quiz.questions.map((question, questionIndex) => (
        <div
          key={question.id}
          className="rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <div className="mb-3 font-medium">
            {questionIndex + 1}. {question.question}
          </div>

          <div className="space-y-2">
            {question.options.map((option, optionIndex) => {
              const selected = answers[questionIndex] === optionIndex;
              const isCorrect = question.correctIndex === optionIndex;

              let optionClass = "border-white/10 hover:bg-white/5";

              if (submitted && isCorrect) {
                optionClass = "border-emerald-500 bg-emerald-500/20";
              } else if (submitted && selected && !isCorrect) {
                optionClass = "border-red-500 bg-red-500/20";
              } else if (selected) {
                optionClass = "border-blue-500 bg-blue-500/20";
              }

              return (
                <button
                  key={optionIndex}
                  type="button"
                  onClick={() => selectAnswer(questionIndex, optionIndex)}
                  className={`block w-full rounded-xl border px-4 py-3 text-left transition ${optionClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {submitted && question.explanation ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
              <span className="font-medium text-zinc-100">Wyjaśnienie: </span>
              {question.explanation}
            </div>
          ) : null}
        </div>
      ))}

      {!submitted ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered}
            className={`rounded-2xl px-6 py-3 font-semibold transition ${
              allAnswered
                ? "bg-blue-600 hover:bg-blue-500"
                : "cursor-not-allowed bg-zinc-700 text-zinc-400"
            }`}
          >
            Sprawdź wynik
          </button>

          {!allAnswered ? (
            <div className="text-sm text-zinc-500">
              Odpowiedz na wszystkie pytania, aby sprawdzić wynik.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold">Twój wynik: {score}%</div>

            {passed ? (
              <div className="mt-2 text-emerald-400">Quiz zaliczony ✅</div>
            ) : (
              <div className="mt-2 text-red-400">
                Quiz niezaliczony ❌ (min. {quiz.passPercent}%)
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {!passed ? (
              <button
                type="button"
                onClick={resetQuiz}
                className="rounded-2xl bg-zinc-700 px-6 py-3 font-semibold hover:bg-zinc-600"
              >
                Spróbuj ponownie
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/education/kurs")}
                  className="rounded-2xl bg-emerald-600 px-6 py-3 font-semibold hover:bg-emerald-500"
                >
                  Wróć do kursu
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
                >
                  Kontynuuj
                </button>
              </>
            )}
          </div>

          {passedOnce ? (
            <div className="text-sm text-zinc-400">
              Quiz został zapisany jako ukończony.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}