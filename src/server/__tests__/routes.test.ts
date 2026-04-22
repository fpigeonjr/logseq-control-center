import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import { fileURLToPath } from "url";
import { buildIndex } from "../../indexer/index.js";
import { routes } from "../routes.js";
import type { GraphIndex } from "../../shared/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.resolve(__dirname, "../../../tests/fixtures/notes");

let index: GraphIndex;
let app: ReturnType<typeof routes>;

beforeAll(async () => {
  index = await buildIndex(FIXTURE_DIR);
  app = routes(() => index);
});

// Helper: fire a GET request against the Hono router
async function get(path: string) {
  const req = new Request(`http://localhost${path}`);
  const res = await app.fetch(req);
  return { status: res.status, body: await res.json() };
}

// ---------------------------------------------------------------------------
// /health
// ---------------------------------------------------------------------------

describe("GET /health", () => {
  it("returns ok:true with page count", async () => {
    const { status, body } = await get("/health");
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(typeof body.pages).toBe("number");
    expect(body.pages).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// /today
// ---------------------------------------------------------------------------

describe("GET /today", () => {
  it("returns a date string and yesterday/tomorrow offsets", async () => {
    const { status, body } = await get("/today");
    expect(status).toBe(200);
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.tomorrow).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// /journal/:date
// ---------------------------------------------------------------------------

describe("GET /journal/:date", () => {
  it("returns the page for a date that exists in fixtures", async () => {
    const { status, body } = await get("/journal/2026-04-22");
    expect(status).toBe(200);
    expect(body.date).toBe("2026-04-22");
    expect(body.page).not.toBeNull();
    expect(body.page.isJournal).toBe(true);
  });

  it("returns null page for a date not in fixtures", async () => {
    const { status, body } = await get("/journal/2000-01-01");
    expect(status).toBe(200);
    expect(body.page).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// /projects
// ---------------------------------------------------------------------------

describe("GET /projects", () => {
  it("splits projects by status", async () => {
    const { status, body } = await get("/projects");
    expect(status).toBe(200);
    expect(Array.isArray(body.active)).toBe(true);
    expect(Array.isArray(body.planning)).toBe(true);
    expect(Array.isArray(body.completed)).toBe(true);
    expect(body.active).toHaveLength(1);
    expect(body.active[0].title).toBe("Active Project");
    expect(body.planning).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// /areas
// ---------------------------------------------------------------------------

describe("GET /areas", () => {
  it("returns overdue, upcoming, and ok buckets", async () => {
    const { status, body } = await get("/areas");
    expect(status).toBe(200);
    expect(Array.isArray(body.overdue)).toBe(true);
    expect(Array.isArray(body.upcoming)).toBe(true);
    expect(Array.isArray(body.ok)).toBe(true);
    // Financial Management was last reviewed 20250101 — well overdue
    const allTitles = [...body.overdue, ...body.upcoming, ...body.ok].map(
      (p: { title: string }) => p.title
    );
    expect(allTitles).toContain("Financial Management");
    expect(allTitles).toContain("Health");
  });

  it("marks Financial Management as overdue (last review > 30 days ago)", async () => {
    const { body } = await get("/areas");
    const overdueTitles = body.overdue.map((p: { title: string }) => p.title);
    expect(overdueTitles).toContain("Financial Management");
  });
});

// ---------------------------------------------------------------------------
// /resources
// ---------------------------------------------------------------------------

describe("GET /resources", () => {
  it("returns only resource pages sorted alphabetically", async () => {
    const { status, body } = await get("/resources");
    expect(status).toBe(200);
    expect(body.resources).toHaveLength(1);
    expect(body.resources[0].para).toBe("resource");
  });
});

// ---------------------------------------------------------------------------
// /random
// ---------------------------------------------------------------------------

describe("GET /random", () => {
  it("returns a non-journal, non-archive page", async () => {
    const { status, body } = await get("/random");
    expect(status).toBe(200);
    expect(body.page).toBeDefined();
    expect(body.page.isJournal).toBe(false);
    expect(body.page.para).not.toBe("archive");
  });
});

// ---------------------------------------------------------------------------
// /page/:title
// ---------------------------------------------------------------------------

describe("GET /page/:title", () => {
  it("returns the page and its backlinks", async () => {
    const { status, body } = await get(
      `/page/${encodeURIComponent("Active Project")}`
    );
    expect(status).toBe(200);
    expect(body.page.title).toBe("Active Project");
    expect(Array.isArray(body.backlinks)).toBe(true);
    // Linked from 2026-04-22 journal
    const backlinkTitles = body.backlinks.map((p: { title: string }) => p.title);
    expect(backlinkTitles).toContain("2026-04-22");
  });

  it("returns 404 for an unknown page", async () => {
    const { status } = await get("/page/Does%20Not%20Exist");
    expect(status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// /search
// ---------------------------------------------------------------------------

describe("GET /search", () => {
  it("returns matching results for a query", async () => {
    const { status, body } = await get("/search?q=project");
    expect(status).toBe(200);
    expect(body.query).toBe("project");
    expect(body.results.length).toBeGreaterThan(0);
    const titles = body.results.map((r: { page: { title: string } }) => r.page.title);
    expect(titles).toContain("Active Project");
  });

  it("returns empty results for an empty query", async () => {
    const { body } = await get("/search?q=");
    expect(body.results).toHaveLength(0);
  });

  it("is case-insensitive", async () => {
    const { body } = await get("/search?q=TYPESCRIPT");
    const titles = body.results.map((r: { page: { title: string } }) => r.page.title);
    expect(titles).toContain("TypeScript Notes");
  });
});

// ---------------------------------------------------------------------------
// /stats
// ---------------------------------------------------------------------------

describe("GET /stats", () => {
  it("returns correct PARA counts", async () => {
    const { status, body } = await get("/stats");
    expect(status).toBe(200);
    expect(body.paraBreakdown.project).toBe(2);
    expect(body.paraBreakdown.area).toBe(2);
    expect(body.paraBreakdown.resource).toBe(1);
    expect(body.activeProjects).toBe(1);
    expect(body.totalJournals).toBe(2);
  });
});
