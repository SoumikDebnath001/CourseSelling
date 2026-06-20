/**
 * Escape a string for safe interpolation into HTML (e.g. email bodies built from
 * user-supplied input). Prevents HTML/markup injection in the rendered message.
 */
export function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
