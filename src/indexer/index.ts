import fs from "fs/promises";
import path from "path";
import type {
  NotePage,
  GraphIndex,
  ParaCategory,
  ProjectStatus,
  ReviewFrequency,
  Priority,
} from "../shared/types.js";
import { parseLogseqFile, extractLinks, makePreview } from "./parser.js";

// ---------------------------------------------------------------------------
// Journal date helpers
// ---------------------------------------------------------------------------

/**
 * LogSeq journal filenames: YYYY_MM_DD.md
 * Returns ISO date string "YYYY-MM-DD" or null.
 */
function journalFilenameToDate(filename: string): string | null {
  const m = filename.match(/^(\d{4})_(\d{2})_(\d{2})\.md$/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

// ---------------------------------------------------------------------------
// Single-file builder
// ---------------------------------------------------------------------------

async function buildPage(
  filePath: string,
  notesDir: string
): Promise<NotePage | null> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }

  const relativePath = path.relative(notesDir, filePath);
  const dir = path.dirname(relativePath);
  const filename = path.basename(filePath);
  const isJournal = dir === "journals";
  const journalDate = isJournal ? journalFilenameToDate(filename) : undefined;
  const title = filename.replace(/\.md$/, "").replace(/_/g, " ");

  const { props, bodyLines } = parseLogseqFile(raw);
  const bodyText = bodyLines.join("\n");

  const page: NotePage = {
    title: isJournal && journalDate
      ? journalDate
      : title,
    filePath,
    relativePath,
    isJournal,
    journalDate: journalDate ?? undefined,
    props,
    para: (props["para"] as ParaCategory) ?? undefined,
    status: (props["status"] as ProjectStatus) ?? undefined,
    priority: (props["priority"] as Priority) ?? undefined,
    frequency: (props["frequency"] as ReviewFrequency) ?? undefined,
    created: props["created"] ? Number(props["created"]) : undefined,
    lastReview: props["last-review"] ? Number(props["last-review"]) : undefined,
    outcome: props["outcome"] ?? undefined,
    responsibility: props["responsibility"] ?? undefined,
    outgoingLinks: extractLinks(bodyText),
    preview: makePreview(bodyLines),
  };

  return page;
}

// ---------------------------------------------------------------------------
// Full graph builder
// ---------------------------------------------------------------------------

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  let entries: Awaited<ReturnType<typeof fs.readdir>>;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Only descend into pages/ and journals/ to avoid LogSeq cache dirs
      if (["pages", "journals"].includes(entry.name)) {
        files.push(...(await collectMarkdownFiles(full)));
      }
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

export async function buildIndex(notesDir: string): Promise<GraphIndex> {
  const absNotesDir = path.resolve(notesDir.replace(/^~/, process.env.HOME!));

  // Collect from pages/ and journals/ at the top level
  const pagesDir = path.join(absNotesDir, "pages");
  const journalsDir = path.join(absNotesDir, "journals");

  const [pageFiles, journalFiles] = await Promise.all([
    collectMarkdownFiles(pagesDir),
    collectMarkdownFiles(journalsDir),
  ]);

  const allFiles = [...pageFiles, ...journalFiles];

  const pages = (
    await Promise.all(allFiles.map((f) => buildPage(f, absNotesDir)))
  ).filter((p): p is NotePage => p !== null);

  // Build backlinks map
  const backlinks: Record<string, string[]> = {};
  for (const page of pages) {
    for (const link of page.outgoingLinks) {
      if (!backlinks[link]) backlinks[link] = [];
      backlinks[link].push(page.title);
    }
  }

  return {
    builtAt: new Date().toISOString(),
    pages,
    backlinks,
  };
}
