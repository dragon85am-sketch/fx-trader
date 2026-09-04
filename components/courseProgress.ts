import { ALL_LESSON_IDS_IN_ORDER } from "@/components/course";
import { scopedStorageKey } from "@/lib/userScopedStorage";

const COURSE_PROGRESS_KEY = "fx-trade-academy-progress";

export type CourseProgress = {
  completed: Record<string, boolean>;
};

const EMPTY_PROGRESS: CourseProgress = {
  completed: {},
};

export function getCourseProgress(): CourseProgress {
  if (typeof window === "undefined") {
    return EMPTY_PROGRESS;
  }

  try {
    const raw = window.localStorage.getItem(scopedStorageKey(COURSE_PROGRESS_KEY));

    if (!raw) {
      return EMPTY_PROGRESS;
    }

    const parsed = JSON.parse(raw) as Partial<CourseProgress>;

    return {
      completed:
        parsed && parsed.completed && typeof parsed.completed === "object"
          ? parsed.completed
          : {},
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveCourseProgress(progress: CourseProgress) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(scopedStorageKey(COURSE_PROGRESS_KEY), JSON.stringify(progress));
}

export function markLessonCompleted(lessonId: string): CourseProgress {
  const current = getCourseProgress();

  const next: CourseProgress = {
    completed: {
      ...current.completed,
      [lessonId]: true,
    },
  };

  saveCourseProgress(next);
  return next;
}

export function markLessonUncompleted(lessonId: string): CourseProgress {
  const current = getCourseProgress();

  const nextCompleted = { ...current.completed };
  delete nextCompleted[lessonId];

  const next: CourseProgress = {
    completed: nextCompleted,
  };

  saveCourseProgress(next);
  return next;
}

export function resetCourseProgress(): CourseProgress {
  saveCourseProgress(EMPTY_PROGRESS);
  return EMPTY_PROGRESS;
}

export function isLessonCompleted(
  lessonId: string,
  progress?: CourseProgress
): boolean {
  const current = progress ?? getCourseProgress();
  return !!current.completed?.[lessonId];
}

/**
 * Logika odblokowania:
 * - pierwsza lekcja kursu jest zawsze odblokowana
 * - każda kolejna odblokowuje się po ukończeniu poprzedniej
 */
export function isLessonUnlocked(
  lessonId: string,
  progress?: CourseProgress
): boolean {
  const current = progress ?? getCourseProgress();
  const index = ALL_LESSON_IDS_IN_ORDER.indexOf(lessonId);

  if (index === -1) return false;
  if (index === 0) return true;

  const previousLessonId = ALL_LESSON_IDS_IN_ORDER[index - 1];
  return !!current.completed?.[previousLessonId];
}

export function getNextLessonId(progress?: CourseProgress): string | null {
  const current = progress ?? getCourseProgress();

  return (
    ALL_LESSON_IDS_IN_ORDER.find((id) => !current.completed?.[id]) ??
    ALL_LESSON_IDS_IN_ORDER[0] ??
    null
  );
}

export function getPreviousLessonId(currentLessonId: string): string | null {
  const index = ALL_LESSON_IDS_IN_ORDER.indexOf(currentLessonId);

  if (index <= 0) return null;
  return ALL_LESSON_IDS_IN_ORDER[index - 1] ?? null;
}

export function getDoneLessonsCount(progress?: CourseProgress): number {
  const current = progress ?? getCourseProgress();

  return ALL_LESSON_IDS_IN_ORDER.filter((id) => !!current.completed?.[id]).length;
}

export function getTotalLessonsCount(): number {
  return ALL_LESSON_IDS_IN_ORDER.length;
}

export function getRemainingLessonsCount(progress?: CourseProgress): number {
  const total = getTotalLessonsCount();
  const done = getDoneLessonsCount(progress);

  return Math.max(total - done, 0);
}

export function getProgressPercent(progress?: CourseProgress): number {
  const total = getTotalLessonsCount();
  const done = getDoneLessonsCount(progress);

  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

export function isCourseCompleted(progress?: CourseProgress): boolean {
  const total = getTotalLessonsCount();
  const done = getDoneLessonsCount(progress);

  return total > 0 && done >= total;
}

export function emitCourseProgressChanged() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event("course-progress-changed"));
}