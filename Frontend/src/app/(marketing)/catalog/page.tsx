"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useCatalog, useCategories } from "@/hooks/useCourses";
import { useMyProgression } from "@/hooks/useProgression";
import { useSettings } from "@/hooks/useSettings";
import { CourseCard } from "@/components/course/CourseCard";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { courseLocked, isEntryLevel, levelLabel, categoryId } from "@/lib/levels";

type PriceSort = "none" | "asc" | "desc";

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [path, setPath] = useState<string>("all");
  const [levelKeys, setLevelKeys] = useState<string[]>([]);
  const [priceSort, setPriceSort] = useState<PriceSort>("none");
  const [freeOnly, setFreeOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = useCategories();
  // Fetch the whole published catalogue once; all filtering happens instantly client-side.
  const { data: courses, isLoading } = useCatalog();
  const { data: progression } = useMyProgression();
  const { settings } = useSettings();
  const levels = [...settings.levels].sort((a, b) => a.order - b.order);

  const toggleLevel = (key: string) =>
    setLevelKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const filtered = useMemo(() => {
    let list = [...(courses ?? [])];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.courseName.toLowerCase().includes(q));
    }
    if (path !== "all") list = list.filter((c) => categoryId(c.category) === path);
    if (levelKeys.length) list = list.filter((c) => levelKeys.includes(c.level ?? "foundation"));
    if (freeOnly) list = list.filter((c) => (c.price ?? 0) <= 0);
    if (priceSort === "asc") list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (priceSort === "desc") list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    return list;
  }, [courses, search, path, levelKeys, freeOnly, priceSort]);

  const activeFilters = (path !== "all" ? 1 : 0) + levelKeys.length + (freeOnly ? 1 : 0) + (priceSort !== "none" ? 1 : 0);
  const clearAll = () => {
    setPath("all");
    setLevelKeys([]);
    setPriceSort("none");
    setFreeOnly(false);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-ink-900">Cricket courses</h1>
          <p className="mt-1 text-ink-500">Structured video lessons, module tests and coach feedback.</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm ring-1 ring-ink-200 hover:bg-ink-50 transition-colors w-fit"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {showFilters ? "Hide Filters" : "Show Filters"}
          {activeFilters > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      <div className={cn("mt-6 grid gap-6", showFilters ? "lg:grid-cols-[260px_1fr]" : "grid-cols-1")}>
        {/* Filters */}
        {showFilters && (
          <aside className="space-y-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses…" className="input pl-9" />
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-800">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </h2>
              {activeFilters > 0 && (
                <button onClick={clearAll} className="flex items-center gap-1 text-xs font-medium text-ink-400 hover:text-ball-600">
                  <X className="h-3 w-3" /> Clear ({activeFilters})
                </button>
              )}
            </div>

            {/* Path / Category */}
            <FilterGroup title="Path / Category">
              <div className="flex flex-wrap gap-2">
                <Chip active={path === "all"} onClick={() => setPath("all")}>All</Chip>
                {(categories ?? []).map((c) => (
                  <Chip key={c._id} active={path === c._id} onClick={() => setPath(c._id)}>{c.name}</Chip>
                ))}
              </div>
            </FilterGroup>

            {/* Level (multi-select) */}
            <FilterGroup title="Level">
              <div className="flex flex-wrap gap-2">
                {levels.map((l) => (
                  <Chip key={l.key} active={levelKeys.includes(l.key)} onClick={() => toggleLevel(l.key)}>
                    {l.label || l.name}
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            {/* Price */}
            <FilterGroup title="Price">
              <div className="flex flex-wrap gap-2">
                <Chip active={priceSort === "asc"} onClick={() => setPriceSort((p) => (p === "asc" ? "none" : "asc"))}>Low → High</Chip>
                <Chip active={priceSort === "desc"} onClick={() => setPriceSort((p) => (p === "desc" ? "none" : "desc"))}>High → Low</Chip>
              </div>
            </FilterGroup>

            {/* Free toggle */}
            <label className="mt-4 flex cursor-pointer items-center justify-between">
              <span className="text-sm font-medium text-ink-700">Show free courses only</span>
              <button
                type="button"
                role="switch"
                aria-checked={freeOnly}
                onClick={() => setFreeOnly((v) => !v)}
                className={cn("relative h-5 w-9 rounded-full transition-colors", freeOnly ? "bg-pitch-600" : "bg-ink-200")}
              >
                <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", freeOnly ? "left-4" : "left-0.5")} />
              </button>
            </label>
          </div>
          </aside>
        )}

        {/* Results */}
        <section>
          {isLoading ? (
            <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
          ) : filtered.length > 0 ? (
            <>
              <p className="mb-3 text-sm text-ink-400">{filtered.length} course{filtered.length === 1 ? "" : "s"}</p>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((c) => {
                  const locked = courseLocked(progression, c);
                  const label = isEntryLevel(levels, c.level) ? undefined : levelLabel(levels, c.level);
                  return (
                    <CourseCard
                      key={c._id}
                      course={c}
                      locked={locked}
                      levelLabel={label}
                      lockHint={label ? `Reach ${label} to unlock` : "Locked"}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <p className="mt-16 text-center text-ink-400">No courses match these filters.</p>
          )}
        </section>
      </div>
    </main>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-ink-100 pt-3 first:mt-3 first:border-0 first:pt-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{title}</h3>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-sm font-medium transition",
        active ? "bg-pitch-600 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-ink-300"
      )}
    >
      {children}
    </button>
  );
}
