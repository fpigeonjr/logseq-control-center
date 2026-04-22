import { test, expect } from "@playwright/test";

/**
 * E2E smoke tests — these hit the real Hono server (started by playwright.config.ts webServer).
 * NOTES_DIR must point to a real or fixture notes directory.
 */

test.describe("API health", () => {
  test("GET /api/health returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.pages).toBe("number");
  });
});

test.describe("API /today", () => {
  test("returns today's date and nav offsets", async ({ request }) => {
    const res = await request.get("/api/today");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.tomorrow).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Today's date should match JS Date
    const today = new Date().toISOString().split("T")[0];
    expect(body.date).toBe(today);
  });
});

test.describe("API /projects", () => {
  test("returns project buckets", async ({ request }) => {
    const res = await request.get("/api/projects");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.active)).toBe(true);
    expect(Array.isArray(body.planning)).toBe(true);
    expect(Array.isArray(body.completed)).toBe(true);
  });
});

test.describe("API /areas", () => {
  test("returns area buckets", async ({ request }) => {
    const res = await request.get("/api/areas");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.overdue)).toBe(true);
    expect(Array.isArray(body.upcoming)).toBe(true);
    expect(Array.isArray(body.ok)).toBe(true);
  });
});

test.describe("API /random", () => {
  test("returns a page", async ({ request }) => {
    const res = await request.get("/api/random");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.page).toBeDefined();
    expect(typeof body.page.title).toBe("string");
  });
});

test.describe("API /search", () => {
  test("returns results array for a query", async ({ request }) => {
    const res = await request.get("/api/search?q=project");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.results)).toBe(true);
  });
});

test.describe("API /stats", () => {
  test("returns numeric counts", async ({ request }) => {
    const res = await request.get("/api/stats");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(typeof body.totalPages).toBe("number");
    expect(typeof body.totalJournals).toBe("number");
    expect(typeof body.activeProjects).toBe("number");
    expect(typeof body.overdueAreas).toBe("number");
  });
});
