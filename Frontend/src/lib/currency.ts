/**
 * Single source of truth for money formatting. The platform is KES-only — every price,
 * invoice, report and filter renders through here so no other currency leaks in.
 *
 *   formatKES(1000)  -> "KES 1,000"
 *   formatKES(0)     -> "Free"
 *   formatKES(0,{zero:true}) -> "KES 0"
 */
export function formatKES(amount?: number, opts?: { zero?: boolean }): string {
  const n = amount ?? 0;
  if (n <= 0 && !opts?.zero) return "Free";
  return `KES ${Math.round(n).toLocaleString("en-KE")}`;
}
