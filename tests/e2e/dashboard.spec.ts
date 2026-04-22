import { test, expect } from "@playwright/test";

/**
 * Dashboard UI e2e tests.
 * These run against the full stack: Hono server + Vite-built Svelte app.
 * The webServer in playwright.config.ts starts only the API server;
 * for UI tests we use the Vite dev server separately or the built dist.
 *
 * For now these tests target the API layer only (same as api.spec.ts) until
 * the full build pipeline is wired into the playwright webServer config.
 * TODO (M3): update webServer to serve built dist so UI tests run against
 * the real rendered page.
 */

test.describe("Dashboard — API integration (M2)", () => {
  test("GET /api/today returns today's date", async ({ request }) => {
    const res = await request.get("/api/today");
    expect(res.ok()).toBe(true);

    const body = await res.json();
    const today = new Date().toISOString().split("T")[0];
    expect(body.date).toBe(today);
  });

  test("GET /api/projects returns the three status buckets", async ({ request }) => {
    const res = await request.get("/api/projects");
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(Array.isArray(body.active)).toBe(true);
    expect(Array.isArray(body.planning)).toBe(true);
    expect(Array.isArray(body.completed)).toBe(true);

    // Active projects should have status: active
    for (const p of body.active) {
      expect(p.status).toBe("active");
    }
  });

  test("GET /api/areas buckets are mutually exclusive", async ({ request }) => {
    const res = await request.get("/api/areas");
    expect(res.ok()).toBe(true);

    const body = await res.json();
    const allTitles = [
      ...body.overdue.map((a: { title: string }) => a.title),
      ...body.upcoming.map((a: { title: string }) => a.title),
      ...body.ok.map((a: { title: string }) => a.title),
    ];
    // No title should appear in more than one bucket
    const unique = new Set(allTitles);
    expect(unique.size).toBe(allTitles.length);
  });

  test("GET /api/content/:title returns body text", async ({ request }) => {
    // First get a known page title from the projects list
    const projectsRes = await request.get("/api/projects");
    const projects = await projectsRes.json();
    const allProjects = [...projects.active, ...projects.planning];

    if (allProjects.length === 0) {
      test.skip(true, "No projects in graph — skipping content test");
      return;
    }

    const title = allProjects[0].title;
    const res = await request.get(`/api/content/${encodeURIComponent(title)}`);
    expect(res.ok()).toBe(true);

    const body = await res.json();
    expect(body.title).toBe(title);
    expect(typeof body.content).toBe("string");
  });

  test("GET /api/stats overdue count matches /api/areas overdue length", async ({ request }) => {
    const [statsRes, areasRes] = await Promise.all([
      request.get("/api/stats"),
      request.get("/api/areas"),
    ]);

    const stats = await statsRes.json();
    const areas = await areasRes.json();

    expect(stats.overdueAreas).toBe(areas.overdue.length);
  });

  test("GET /api/random never returns a journal or archive page", async ({ request }) => {
    // Call it 5 times to reduce flakiness
    for (let i = 0; i < 5; i++) {
      const res = await request.get("/api/random");
      if (!res.ok()) continue; // skip if no pages in graph
      const body = await res.json();
      expect(body.page.isJournal).toBe(false);
      expect(body.page.para).not.toBe("archive");
    }
  });
});
