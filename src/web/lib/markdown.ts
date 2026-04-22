/**
 * Minimal LogSeq body renderer — converts raw block text to HTML.
 *
 * Handles the patterns that appear in journal and page bodies:
 *   - `- ` bullet (any indentation depth)
 *   - `## Heading` — both bare lines AND inside a bullet
 *   - LogSeq task states: TODO / DOING / DONE / LATER / NOW / WAITING / CANCELLED
 *   - `[[wikilink]]` → styled span
 *   - `**bold**` → <strong>
 *   - `` `code` `` → <code>
 *   - `#tag` → badge span
 *
 * This is NOT a full markdown parser — just enough for readable journals.
 */

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;
const BOLD_RE = /\*\*([^*]+)\*\*/g;
const CODE_RE = /`([^`]+)`/g;
const TAG_RE = /(^|\s)(#[a-zA-Z0-9_/-]+)/g;
const BULLET_RE = /^(\s*)- (.*)/;
const HEADING_RE = /^#{1,4}\s+(.+)/;
// Matches LogSeq task keywords at start of bullet content (with optional colon)
const TASK_RE = /^(TODO|DOING|DONE|LATER|NOW|WAITING|CANCELLED):?\s+(.*)/s;

const TASK_META: Record<string, { label: string; cls: string; strike: boolean }> = {
  TODO: { label: "TODO", cls: "task-todo", strike: false },
  DOING: { label: "DOING", cls: "task-doing", strike: false },
  DONE: { label: "DONE", cls: "task-done", strike: true },
  LATER: { label: "LATER", cls: "task-later", strike: false },
  NOW: { label: "NOW", cls: "task-now", strike: false },
  WAITING: { label: "WAITING", cls: "task-waiting", strike: false },
  CANCELLED: { label: "CANCELLED", cls: "task-cancelled", strike: true },
};

function processInline(text: string): string {
  return text
    .replace(WIKILINK_RE, '<span class="wikilink">$1</span>')
    .replace(BOLD_RE, "<strong>$1</strong>")
    .replace(CODE_RE, '<code class="inline-code">$1</code>')
    .replace(TAG_RE, '$1<span class="journal-tag">$2</span>');
}

function renderBulletContent(content: string, depth: number): string {
  const indent = `style="margin-left:${depth * 16}px"`;

  // Task state detection
  const taskMatch = content.match(TASK_RE);
  if (taskMatch) {
    const meta = TASK_META[taskMatch[1]];
    const text = processInline(taskMatch[2]);
    const textHtml = meta.strike ? `<span class="task-strike">${text}</span>` : text;
    return `<div class="journal-bullet task-bullet ${meta.cls}" ${indent}><span class="task-badge">${meta.label}</span>${textHtml}</div>`;
  }

  // Section heading inside a bullet
  const headingMatch = content.match(HEADING_RE);
  if (headingMatch) {
    return `<div class="journal-heading" ${indent}>${processInline(headingMatch[1])}</div>`;
  }

  return `<div class="journal-bullet" ${indent}>${processInline(content)}</div>`;
}

export function renderJournalBody(raw: string): string {
  if (!raw.trim()) return "<p class='empty-journal'>No content yet.</p>";

  const lines = raw.split("\n");
  const parts: string[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const bulletMatch = line.match(BULLET_RE);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const depth = Math.floor(indent / 2);
      parts.push(renderBulletContent(bulletMatch[2], depth));
    } else {
      const trimmed = line.trim();
      // Bare ## heading line (not inside a bullet)
      const headingMatch = trimmed.match(HEADING_RE);
      if (headingMatch) {
        parts.push(`<div class="journal-heading">${processInline(headingMatch[1])}</div>`);
      } else {
        parts.push(`<div class="journal-line">${processInline(trimmed)}</div>`);
      }
    }
  }

  return parts.join("\n");
}
