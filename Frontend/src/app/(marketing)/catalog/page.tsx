"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useCatalog, useCategories } from "@/hooks/useCourses";
import { CourseCard } from "@/components/course/CourseCard";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const { data: categories } = useCategories();
  const { data: courses, isLoading } = useCatalog({ search: search || undefined, category });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-ink-900">Cricket courses</h1>
      <p className="mt-1 text-ink-500">Structured video lessons, module tests and coach feedback.</p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="input pl-9"
          />
        </div>
      </div>

      {categories && categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory(undefined)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              !category ? "bg-pitch-600 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200"
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setCategory(c._id)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                category === c._id ? "bg-pitch-600 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c._id} course={c} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-ink-400">No courses found. Check back soon!</p>
      )}
    </main>
  );
}
