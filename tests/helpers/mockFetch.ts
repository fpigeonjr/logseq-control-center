import { vi } from "vitest";

/**
 * Stub global fetch with a map of path-fragment → response body.
 * Matches the first key that appears anywhere in the request URL.
 *
 * Usage:
 *   mockFetch({ "/api/today": { date: "2026-04-22", page: null, ... } });
 */
export function mockFetch(responses: Record<string, unknown>): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : String(input);
      const key = Object.keys(responses).find((k) => url.includes(k));

      if (!key) {
        return new Response(JSON.stringify({ error: "Not mocked" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(responses[key]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    })
  );
}

/** Restore fetch after each test that uses mockFetch */
export function restoreFetch(): void {
  vi.unstubAllGlobals();
}
