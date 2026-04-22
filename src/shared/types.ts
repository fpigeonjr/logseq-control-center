// ---------------------------------------------------------------------------
// Shared types — used by both the server and the Svelte web UI
// ---------------------------------------------------------------------------

export type ParaCategory = "project" | "area" | "resource" | "archive";
export type ProjectStatus = "planning" | "active" | "completed";
export type ReviewFrequency = "monthly" | "quarterly" | "annually";
export type Priority = "high" | "medium" | "low";

/** A single parsed LogSeq page (pages/ or journals/) */
export interface NotePage {
  /** Filename without extension, e.g. "Logseq Control Center" */
  title: string;
  /** Absolute path on disk */
  filePath: string;
  /** Relative path from NOTES_DIR, e.g. "pages/Logseq Control Center.md" */
  relativePath: string;
  /** true if found in journals/ directory */
  isJournal: boolean;
  /** ISO date string if journal, e.g. "2026-04-22" */
  journalDate?: string;
  /** Raw LogSeq property:: value pairs */
  props: Record<string, string>;
  // Typed convenience fields derived from props
  para?: ParaCategory;
  status?: ProjectStatus;
  priority?: Priority;
  frequency?: ReviewFrequency;
  /** YYYYMMDD number for easy comparison, e.g. 20260422 */
  created?: number;
  /** YYYYMMDD number */
  lastReview?: number;
  outcome?: string;
  responsibility?: string;
  /** [[Page Name]] links found in the body */
  outgoingLinks: string[];
  /** First ~300 chars of body content (after properties) for previews */
  preview: string;
}

/** Full in-memory index of the graph */
export interface GraphIndex {
  /** ISO timestamp of last full rebuild */
  builtAt: string;
  pages: NotePage[];
  /** Reverse link map: page title → titles that link to it */
  backlinks: Record<string, string[]>;
}

// ---------------------------------------------------------------------------
// API response shapes (what the Hono routes return)
// ---------------------------------------------------------------------------

export interface TodayResponse {
  date: string; // ISO
  page: NotePage | null;
  yesterday: string; // ISO
  tomorrow: string; // ISO
}

export interface ProjectsResponse {
  active: NotePage[];
  planning: NotePage[];
  completed: NotePage[];
}

export interface AreasResponse {
  overdue: NotePage[];
  upcoming: NotePage[];
  ok: NotePage[];
}

export interface RandomResponse {
  page: NotePage;
}

export interface SearchResponse {
  query: string;
  results: Array<{ page: NotePage; snippet: string }>;
}

export interface StatsResponse {
  totalPages: number;
  totalJournals: number;
  paraBreakdown: Record<ParaCategory | "none", number>;
  activeProjects: number;
  overdueAreas: number;
}
