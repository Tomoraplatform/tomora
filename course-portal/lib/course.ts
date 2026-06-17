import type { Lesson, Module, ModuleWithLessons } from "@/lib/types";
import type { ModuleStatus } from "@/lib/constants";

/** Orders modules then lessons, grouping lessons under their module. */
export function groupModules(
  modules: Module[],
  lessons: Lesson[],
): ModuleWithLessons[] {
  const byModule = new Map<string, Lesson[]>();
  for (const l of lessons) {
    const arr = byModule.get(l.module_id) || [];
    arr.push(l);
    byModule.set(l.module_id, arr);
  }
  return [...modules]
    .sort((a, b) => a.module_order - b.module_order)
    .map((m) => ({
      ...m,
      lessons: (byModule.get(m.id) || []).sort(
        (a, b) => a.lesson_order - b.lesson_order,
      ),
    }));
}

/** A flat, ordered list of all lessons across modules (welcome first). */
export function flattenLessons(modules: ModuleWithLessons[]): Lesson[] {
  return modules.flatMap((m) => m.lessons);
}

export function moduleStatus(
  lessons: Lesson[],
  completedIds: Set<string>,
): ModuleStatus {
  if (lessons.length === 0) return "Not Started";
  const done = lessons.filter((l) => completedIds.has(l.id)).length;
  if (done === 0) return "Not Started";
  if (done === lessons.length) return "Completed";
  return "In Progress";
}

export interface ProgressSummary {
  total: number;
  completed: number;
  percent: number;
}

export function overallProgress(
  allLessons: Lesson[],
  completedIds: Set<string>,
): ProgressSummary {
  const total = allLessons.length;
  const completed = allLessons.filter((l) => completedIds.has(l.id)).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, percent };
}

/**
 * Continue-where-you-stopped target.
 * - No completed lessons -> first (welcome) lesson.
 * - Some complete -> first incomplete lesson in order.
 * - All complete -> null (caller routes to /complete).
 */
export function nextLessonTarget(
  modules: ModuleWithLessons[],
  completedIds: Set<string>,
): { moduleId: string; lessonId: string } | null {
  const flat = flattenLessons(modules);
  if (flat.length === 0) return null;

  const firstIncomplete = flat.find((l) => !completedIds.has(l.id));
  if (!firstIncomplete) return null; // all complete

  return { moduleId: firstIncomplete.module_id, lessonId: firstIncomplete.id };
}

/** Next lesson after a given lesson, across module boundaries. */
export function lessonNeighbors(
  modules: ModuleWithLessons[],
  lessonId: string,
): { next: Lesson | null; prev: Lesson | null } {
  const flat = flattenLessons(modules);
  const idx = flat.findIndex((l) => l.id === lessonId);
  if (idx === -1) return { next: null, prev: null };
  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx < flat.length - 1 ? flat[idx + 1] : null,
  };
}
