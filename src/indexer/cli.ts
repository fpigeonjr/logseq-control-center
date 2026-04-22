#!/usr/bin/env tsx
/**
 * CLI entry point for the indexer.
 *
 * Usage:
 *   npm run index                        # uses NOTES_DIR from .env
 *   npm run index -- --notes ~/Notes     # explicit path
 *   npm run index -- --stats             # summary instead of full JSON
 */

import path from "path";
import fs from "fs/promises";
import { buildIndex } from "./index.js";

// ---------------------------------------------------------------------------
// Minimal .env loader (no dependency needed)
// ---------------------------------------------------------------------------
async function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    const text = await fs.readFile(envPath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // no .env — that's fine
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
await loadEnv();

const args = process.argv.slice(2);
const statsOnly = args.includes("--stats");
const notesIdx = args.indexOf("--notes");
const notesDir =
  notesIdx !== -1 && args[notesIdx + 1] ? args[notesIdx + 1] : (process.env.NOTES_DIR ?? "~/Notes");

console.error(`[indexer] Building index from: ${notesDir}`);
const t0 = Date.now();
const index = await buildIndex(notesDir);
const elapsed = Date.now() - t0;
console.error(`[indexer] Done in ${elapsed}ms — ${index.pages.length} pages indexed`);

if (statsOnly) {
  const projects = index.pages.filter((p) => p.para === "project");
  const areas = index.pages.filter((p) => p.para === "area");
  const resources = index.pages.filter((p) => p.para === "resource");
  const archive = index.pages.filter((p) => p.para === "archive");
  const journals = index.pages.filter((p) => p.isJournal);

  console.log(
    JSON.stringify(
      {
        builtAt: index.builtAt,
        elapsedMs: elapsed,
        total: index.pages.length,
        journals: journals.length,
        pages: index.pages.length - journals.length,
        para: {
          project: projects.length,
          area: areas.length,
          resource: resources.length,
          archive: archive.length,
          none:
            index.pages.length - projects.length - areas.length - resources.length - archive.length,
        },
        activeProjects: projects.filter((p) => p.status === "active").length,
        backlinkEntries: Object.keys(index.backlinks).length,
        samplePage: index.pages.find((p) => !p.isJournal) ?? null,
      },
      null,
      2
    )
  );
} else {
  console.log(JSON.stringify(index, null, 2));
}
