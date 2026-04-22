/**
 * LogSeq property parser
 *
 * LogSeq properties live at the TOP of a file as bare lines in the form:
 *   key:: value
 *
 * Rules:
 *  - Properties must appear before any bullet (`- `) or heading (`#`) line.
 *  - Keys are lowercase-normalized by LogSeq; we follow suit.
 *  - Values are trimmed strings. Multi-value properties (e.g. `tags:: a, b`)
 *    are kept as a single string — callers split on ", " if needed.
 *  - Blank lines between properties are allowed (LogSeq skips them).
 *  - A line that doesn't match `key:: value` ends the property block.
 */

const PROP_RE = /^([a-zA-Z0-9_-]+)::\s*(.*)/;

export interface ParsedFile {
  props: Record<string, string>;
  /** Body lines after the property block (joined back to string for preview) */
  bodyLines: string[];
}

export function parseLogseqFile(raw: string): ParsedFile {
  const lines = raw.split("\n");
  const props: Record<string, string> = {};
  let i = 0;

  // Walk through leading lines collecting properties
  for (; i < lines.length; i++) {
    const line = lines[i];
    // Allow blank lines inside the property block
    if (line.trim() === "") continue;
    const m = line.match(PROP_RE);
    if (!m) break; // first non-property, non-blank line ends the block
    props[m[1].toLowerCase()] = m[2].trim();
  }

  return { props, bodyLines: lines.slice(i) };
}

/** Extract all [[Page Name]] links from a body string */
export function extractLinks(body: string): string[] {
  const links = new Set<string>();
  for (const m of body.matchAll(/\[\[([^\]]+)\]\]/g)) {
    links.add(m[1]);
  }
  return [...links];
}

/** Return the first ~300 chars of meaningful body content */
export function makePreview(bodyLines: string[]): string {
  return bodyLines
    .join("\n")
    .replace(/\[\[([^\]]+)\]\]/g, "$1") // de-bracket links
    .replace(/[#*`]/g, "") // strip markdown noise
    .trim()
    .slice(0, 300);
}
