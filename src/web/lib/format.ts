/**
 * Date formatting helpers — pure functions, fully testable.
 */

/**
 * "2026-04-22" → "Tuesday, April 22 2026"
 * Uses local midnight to avoid timezone-off-by-one on the date.
 */
export function formatJournalDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 20260422 → "Apr 22 2026"
 */
export function yyyymmddToDisplay(n: number): string {
  const s = String(n);
  return new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00`).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );
}

/**
 * Days elapsed since a YYYYMMDD date (always >= 0).
 */
export function daysSince(yyyymmdd: number): number {
  const s = String(yyyymmdd);
  const d = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00`);
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}

/**
 * "2026-04-22" offset by N days → "2026-04-21" (prev) or "2026-04-23" (next)
 */
export function isoOffset(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
