/**
 * Thin fetch wrapper — all web components call /api/* through this.
 * Centralised so tests can mock `fetch` once and all API calls are captured.
 */
export async function api<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}
