"use client";

import Link from "next/link";
import React from "react";
import {
  COURSE,
  getModuleByLessonId,
  type CourseLesson,
} from "@/components/course";
import {
  isLessonCompleted,
  isLessonUnlocked,
  type CourseProgress,
} from "@/components/courseProgress";

export default function CourseLessonSidebar({
  lessonId,
  progress,
}: {
  lessonId: string;
  progress: CourseProgress;
}) {
  const currentModule = getModuleByLessonId(lessonId);

  return (
    <div className="space-y-4">
      {COURSE.modules.map((module) => (
        <SidebarModuleBlock
          key={module.title}
          title={module.title}
          items={module.items}
          lessonId={lessonId}
          progress={progress}
          defaultOpen={module.title === currentModule?.title}
        />
      ))}
    </div>
  );
}

function SidebarModuleBlock({
  title,
  items,
  lessonId,
  progress,
  defaultOpen,
}: {
  title: string;
  items: CourseLesson[];
  lessonId: string;
  progress: CourseProgress;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  React.useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  const doneCount = items.filter((item) =>
    isLessonCompleted(item.id, progress)
  ).length;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="mt-1 text-sm text-zinc-400">
            {doneCount}/{items.length} ukończone
          </div>
        </div>

        <span className="text-zinc-400">{open ? "▾" : "▸"}</span>
      </button>

      {open ? (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          {items.map((lesson) => {
            const completed = isLessonCompleted(lesson.id, progress);
            const unlocked = lesson.free || isLessonUnlocked(lesson.id, progress);
            const active = lesson.id === lessonId;

            const icon = completed ? "✅" : unlocked ? "•" : "🔒";

            return (
              <Link
                key={lesson.id}
                href={unlocked ? `/education/kurs/${lesson.id}` : "#"}
                className={`flex items-start gap-3 rounded-2xl px-3 py-3 transition ${
                  active
                    ? "border border-blue-500/30 bg-blue-500/10"
                    : unlocked
                    ? "hover:bg-white/5"
                    : "cursor-not-allowed opacity-60"
                }`}
              >
                <span className="mt-0.5 text-sm">{icon}</span>

                <div className="min-w-0">
                  <div
                    className={`font-medium leading-tight ${
                      active ? "text-white" : "text-zinc-200"
                    }`}
                  >
                    {lesson.title}
                  </div>

                  <div className="mt-1 text-xs text-zinc-400">
                    {lesson.type === "quiz"
                      ? "Quiz modułowy"
                      : lesson.minutes
                      ? `${lesson.minutes} min`
                      : "Lekcja"}
                    {active ? " • kontynuuj tutaj" : ""}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}