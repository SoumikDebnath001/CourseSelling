/** The whole site runs on Kenya time — East Africa Time (EAT, UTC+3). */
export const KENYA_TZ = "Africa/Nairobi";

/**
 * A date rendered in Kenya time with the timezone mentioned,
 * e.g. "16 Jul 2026 (EAT)". Pass month:"long" for the spelled-out form.
 */
export function formatKenyaDate(d: string | number | Date, opts: Intl.DateTimeFormatOptions = {}): string {
  const s = new Date(d).toLocaleDateString("en-GB", {
    timeZone: KENYA_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    ...opts,
  });
  return `${s} (EAT)`;
}

/** A date + time rendered in Kenya time, e.g. "16 Jul 2026, 14:05 (EAT)". */
export function formatKenyaDateTime(d: string | number | Date): string {
  const s = new Date(d).toLocaleString("en-GB", {
    timeZone: KENYA_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${s} (EAT)`;
}

/** Human-readable file size, e.g. 1435 → "1.4 KB", 3_400_000 → "3.2 MB". */
export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

/** Uppercase file-format badge text from an explicit format or a filename. */
export function formatLabel(format?: string, name?: string): string {
  const ext = format || /\.([A-Za-z0-9]+)$/.exec(name ?? "")?.[1] || "";
  return ext ? ext.toUpperCase() : "FILE";
}
