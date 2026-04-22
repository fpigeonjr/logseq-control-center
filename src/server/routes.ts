import { Hono } from "hono";
import fs from "fs/promises";
import path from "path";
import { parseLogseqFile } from "../indexer/parser.js";
import type {
  GraphIndex,
  NotePage,
  TodayResponse,
  ProjectsResponse,
  AreasResponse,
  RandomResponse,
  SearchResponse,
  StatsResponse,
  ParaCategory,
} from "../shared/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** YYYYMMDD integer for a Date */
function toYYYYMMDD(d: Date): number {
  return (
    d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  );
}

/** ISO date string (YYYY-MM-DD) offset by `days` from today */
function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/** Days since a YYYYMMDD date */
function daysSince(yyyymmdd: number): number {
  const s = String(yyyymmdd);
  const d = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`);
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

const FREQUENCY_DAYS: Record<string, number> = {
  monthly: 30,
  quarterly: 91,
  annually: 365,
};

function isAreaOverdue(page: NotePage): boolean {
  if (!page.lastReview) return true; // never reviewed = overdue
  const threshold = FREQUENCY_DAYS[page.frequency ?? "monthly"] ?? 30;
  return daysSince(page.lastReview) > threshold;
}

// ---------------------------------------------------------------------------
// Route factory
// ---------------------------------------------------------------------------

export function routes(getIndex: () => GraphIndex) {
  const api = new Hono();

  // GET /api/health
  api.get("/health", (c) => {
    const idx = getIndex();
    return c.json({ ok: true, pages: idx.pages.length, builtAt: idx.builtAt });
  });

  // GET /api/today
  api.get("/today", (c) => {
    const idx = getIndex();
    const todayIso = isoOffset(0);
    const page = idx.pages.find((p) => p.journalDate === todayIso) ?? null;
    const res: TodayResponse = {
      date: todayIso,
      page,
      yesterday: isoOffset(-1),
      tomorrow: isoOffset(1),
    };
    return c.json(res);
  });

  // GET /api/journal/:date  (YYYY-MM-DD)
  api.get("/journal/:date", (c) => {
    const idx = getIndex();
    const { date } = c.req.param();
    const page = idx.pages.find((p) => p.journalDate === date) ?? null;
    return c.json({ date, page });
  });

  // GET /api/projects
  api.get("/projects", (c) => {
    const idx = getIndex();
    const projects = idx.pages.filter((p) => p.para === "project");
    const res: ProjectsResponse = {
      active: projects
        .filter((p) => p.status === "active")
        .sort((a, b) => (a.lastReview ?? 0) - (b.lastReview ?? 0)),
      planning: projects.filter((p) => p.status === "planning"),
      completed: projects.filter((p) => p.status === "completed"),
    };
    return c.json(res);
  });

  // GET /api/areas
  api.get("/areas", (c) => {
    const idx = getIndex();
    const areas = idx.pages.filter((p) => p.para === "area");
    const overdue = areas.filter(isAreaOverdue);
    const ok = areas.filter((p) => !isAreaOverdue(p));

    // "upcoming" = ok but will be overdue within 14 days
    const upcoming = ok.filter((p) => {
      if (!p.lastReview) return false;
      const threshold = FREQUENCY_DAYS[p.frequency ?? "monthly"] ?? 30;
      return daysSince(p.lastReview) > threshold - 14;
    });
    const fine = ok.filter((p) => !upcoming.includes(p));

    const res: AreasResponse = {
      overdue,
      upcoming,
      ok: fine,
    };
    return c.json(res);
  });

  // GET /api/resources
  api.get("/resources", (c) => {
    const idx = getIndex();
    const resources = idx.pages
      .filter((p) => p.para === "resource")
      .sort((a, b) => a.title.localeCompare(b.title));
    return c.json({ resources });
  });

  // GET /api/random
  api.get("/random", (c) => {
    const idx = getIndex();
    const pool = idx.pages.filter(
      (p) => !p.isJournal && p.para !== "archive"
    );
    if (pool.length === 0) return c.json({ error: "No pages found" }, 404);
    const page = pool[Math.floor(Math.random() * pool.length)];
    const res: RandomResponse = { page };
    return c.json(res);
  });

  // GET /api/page/:title
  api.get("/page/:title", (c) => {
    const idx = getIndex();
    const { title } = c.req.param();
    const decoded = decodeURIComponent(title);
    const page = idx.pages.find(
      (p) => p.title.toLowerCase() === decoded.toLowerCase()
    );
    if (!page) return c.json({ error: "Not found" }, 404);
    const backlinkTitles = idx.backlinks[page.title] ?? [];
    const backlinks = backlinkTitles
      .map((t) => idx.pages.find((p) => p.title === t))
      .filter(Boolean);
    return c.json({ page, backlinks });
  });

  // GET /api/search?q=...
  api.get("/search", (c) => {
    const idx = getIndex();
    const q = c.req.query("q")?.trim() ?? "";
    if (!q) return c.json({ query: "", results: [] });

    const lower = q.toLowerCase();
    const results: SearchResponse["results"] = [];

    for (const page of idx.pages) {
      const inTitle = page.title.toLowerCase().includes(lower);
      const inPreview = page.preview.toLowerCase().includes(lower);

      if (inTitle || inPreview) {
        let snippet = "";
        if (inPreview) {
          const idx2 = page.preview.toLowerCase().indexOf(lower);
          const start = Math.max(0, idx2 - 60);
          const end = Math.min(page.preview.length, idx2 + lower.length + 60);
          snippet = (start > 0 ? "…" : "") + page.preview.slice(start, end) + (end < page.preview.length ? "…" : "");
        }
        results.push({ page, snippet });
      }
    }

    // Title matches first, then preview-only
    results.sort((a, b) => {
      const aTitle = a.page.title.toLowerCase().includes(lower) ? 0 : 1;
      const bTitle = b.page.title.toLowerCase().includes(lower) ? 0 : 1;
      return aTitle - bTitle;
    });

    return c.json({ query: q, results: results.slice(0, 50) });
  });

  // GET /api/stats
  api.get("/stats", (c) => {
    const idx = getIndex();
    const paraBreakdown: Record<ParaCategory | "none", number> = {
      project: 0,
      area: 0,
      resource: 0,
      archive: 0,
      none: 0,
    };
    let journals = 0;
    for (const p of idx.pages) {
      if (p.isJournal) { journals++; continue; }
      paraBreakdown[p.para ?? "none"]++;
    }
    const areas = idx.pages.filter((p) => p.para === "area");
    const res: StatsResponse = {
      totalPages: idx.pages.length - journals,
      totalJournals: journals,
      paraBreakdown,
      activeProjects: idx.pages.filter(
        (p) => p.para === "project" && p.status === "active"
      ).length,
      overdueAreas: areas.filter(isAreaOverdue).length,
    };
    return c.json(res);
  });

  // GET /api/content/:title — full body text, read on-demand (not cached in index)
  api.get("/content/:title", async (c) => {
    const idx = getIndex();
    const decoded = decodeURIComponent(c.req.param("title"));
    const page = idx.pages.find(
      (p) => p.title.toLowerCase() === decoded.toLowerCase()
    );
    if (!page) return c.json({ error: "Not found" }, 404);
    try {
      const raw = await fs.readFile(page.filePath, "utf8");
      const { bodyLines } = parseLogseqFile(raw);
      return c.json({ title: page.title, content: bodyLines.join("\n") });
    } catch {
      return c.json({ error: "Could not read file" }, 500);
    }
  });

  return api;
}
