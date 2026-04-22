import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import { fileURLToPath } from "url";
import { buildIndex } from "../index.js";
import type { GraphIndex } from "../../shared/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.resolve(__dirname, "../../../tests/fixtures/notes");

let index: GraphIndex;

beforeAll(async () => {
  index = await buildIndex(FIXTURE_DIR);
});

// ---------------------------------------------------------------------------
// Basic shape
// ---------------------------------------------------------------------------

describe("buildIndex", () => {
  it("indexes all pages and journals", () => {
    const pages = index.pages.filter((p) => !p.isJournal);
    const journals = index.pages.filter((p) => p.isJournal);
    expect(pages.length).toBe(5);
    expect(journals.length).toBe(2);
  });

  it("sets builtAt to a valid ISO string", () => {
    expect(() => new Date(index.builtAt)).not.toThrow();
    expect(new Date(index.builtAt).getFullYear()).toBeGreaterThanOrEqual(2026);
  });

  // ---------------------------------------------------------------------------
  // PARA classification
  // ---------------------------------------------------------------------------

  it("classifies PARA categories correctly", () => {
    const byPara = (cat: string) => index.pages.filter((p) => p.para === cat);
    expect(byPara("project")).toHaveLength(2);
    expect(byPara("area")).toHaveLength(2);
    expect(byPara("resource")).toHaveLength(1);
  });

  it("classifies project statuses correctly", () => {
    const active = index.pages.filter((p) => p.para === "project" && p.status === "active");
    const planning = index.pages.filter((p) => p.para === "project" && p.status === "planning");
    expect(active).toHaveLength(1);
    expect(planning).toHaveLength(1);
  });

  // ---------------------------------------------------------------------------
  // Journal detection
  // ---------------------------------------------------------------------------

  it("detects journal pages and sets journalDate", () => {
    const journals = index.pages.filter((p) => p.isJournal);
    const dates = journals.map((j) => j.journalDate);
    expect(dates).toContain("2026-04-22");
    expect(dates).toContain("2026-04-21");
  });

  it("sets journal title to ISO date", () => {
    const today = index.pages.find((p) => p.journalDate === "2026-04-22");
    expect(today?.title).toBe("2026-04-22");
  });

  // ---------------------------------------------------------------------------
  // Typed convenience fields
  // ---------------------------------------------------------------------------

  it("parses created and lastReview as numbers", () => {
    const active = index.pages.find((p) => p.title === "Active Project");
    expect(active?.created).toBe(20260101);
    expect(active?.lastReview).toBe(20260301);
  });

  it("carries outcome, priority, frequency fields", () => {
    const active = index.pages.find((p) => p.title === "Active Project");
    expect(active?.outcome).toBe("Launch the thing");
    expect(active?.priority).toBe("high");

    const finance = index.pages.find((p) => p.title === "Financial Management");
    expect(finance?.frequency).toBe("monthly");
    expect(finance?.responsibility).toBe("Keep finances in order");
  });

  // ---------------------------------------------------------------------------
  // Links and backlinks
  // ---------------------------------------------------------------------------

  it("extracts outgoing [[links]] from journal body", () => {
    const today = index.pages.find((p) => p.journalDate === "2026-04-22");
    expect(today?.outgoingLinks).toContain("Active Project");
    expect(today?.outgoingLinks).toContain("Financial Management");
    expect(today?.outgoingLinks).toContain("TypeScript Notes");
  });

  it("builds backlinks map correctly", () => {
    // "Active Project" is linked from the 2026-04-22 journal
    expect(index.backlinks["Active Project"]).toContain("2026-04-22");
    // "Health" is linked from the 2026-04-21 journal
    expect(index.backlinks["Health"]).toContain("2026-04-21");
  });

  it("pages with no incoming links have no backlinks entry", () => {
    // "Planned Project" is not linked anywhere in fixtures
    expect(index.backlinks["Planned Project"]).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // Preview
  // ---------------------------------------------------------------------------

  it("generates a non-empty preview for pages with body content", () => {
    const resource = index.pages.find((p) => p.title === "TypeScript Notes");
    expect(resource?.preview.length).toBeGreaterThan(0);
    expect(resource?.preview).not.toContain("[[");
  });

  it("preview is at most 300 characters", () => {
    for (const page of index.pages) {
      expect(page.preview.length).toBeLessThanOrEqual(300);
    }
  });
});
