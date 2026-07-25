"use client";

import { useState } from "react";
import { NewCourseCard, CourseCard } from "@/components/creator/course-builder";
import type { CreatorCourseWithContent } from "@/lib/creator/db";

export function CoursesManager({ courses, creatorSlug }: {
  courses: CreatorCourseWithContent[];
  creatorSlug: string;
}) {
  const [openId, setOpenId] = useState<string | null>(courses[0]?.id ?? null);

  return (
    <div className="space-y-4">
      <NewCourseCard creatorSlug={creatorSlug} />
      {courses.length === 0 && (
        <p className="text-sm text-ink/50">No courses yet. Create your first one to start selling.</p>
      )}
      {courses.map((c) => (
        <CourseCard
          key={c.id}
          course={c}
          creatorSlug={creatorSlug}
          open={openId === c.id}
          onToggle={() => setOpenId(openId === c.id ? null : c.id)}
        />
      ))}
    </div>
  );
}
