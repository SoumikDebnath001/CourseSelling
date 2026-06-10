/** URL-safe slug from arbitrary text. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug with a short random suffix to guarantee uniqueness. */
export function uniqueSlug(input: string): string {
  const base = slugify(input) || "course";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}
