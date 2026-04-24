/**
 * Minimal LogSeq body renderer — converts raw block text to HTML.
 *
 * Handles the patterns that appear in journal and page bodies:
 *   - `- ` bullet (any indentation depth)
 *   - `## Heading` — both bare lines AND inside a bullet
 *   - LogSeq task states: TODO / DOING / DONE / LATER / NOW / WAITING / CANCELLED
 *   - `[[wikilink]]` → styled span
 *   - `[text](url)` → <a> link (opens in new tab)
 *   - `**bold**` → <strong>
 *   - `` `code` `` → <code>
 *   - `#tag` → badge span
 *   - `| table | rows |` → scrollable <table>
 *
 * This is NOT a full markdown parser — just enough for readable journals.
 */

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;
// Standard markdown link — must run BEFORE wikilink to avoid double-processing
const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
const BOLD_RE = /\*\*([^*]+)\*\*/g;
const CODE_RE = /`([^`]+)`/g;
const TAG_RE = /(^|\s)(#[a-zA-Z0-9_/-]+)/g;
const BULLET_RE = /^(\s*)- (.*)/;
const HEADING_RE = /^#{1,4}\s+(.+)/;
const TABLE_ROW_RE = /^\|(.+)\|\s*$/;
// Separator rows like |---|---| — skip them
const TABLE_SEP_RE = /^\|[\s|:-]+\|\s*$/;
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
  // Step 1: Stash markdown links as placeholders so subsequent regexes
  // (TAG_RE, CODE_RE, etc.) don't mangle their text or URLs.
  const links: Array<{ placeholder: string; html: string }> = [];
  let idx = 0;
  const withPlaceholders = text.replace(LINK_RE, (_, linkText, url) => {
    const placeholder = `\x00LINK${idx++}\x00`;
    links.push({
      placeholder,
      html: `<a class="md-link" href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`,
    });
    return placeholder;
  });

  // Step 2: Apply remaining inline transforms
  let result = withPlaceholders
    .replace(WIKILINK_RE, '<span class="wikilink">$1</span>')
    .replace(BOLD_RE, "<strong>$1</strong>")
    .replace(CODE_RE, '<code class="inline-code">$1</code>')
    .replace(TAG_RE, '$1<span class="journal-tag">$2</span>');

  // Step 3: Restore links
  for (const { placeholder, html } of links) {
    result = result.replace(placeholder, html);
  }

  return result;
}

function renderTable(rows: string[]): string {
  const htmlRows = rows
    .filter((r) => !TABLE_SEP_RE.test(r))
    .map((row) => {
      const cells = row
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => `<td>${processInline(cell.trim())}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<div class="table-wrapper"><table class="journal-table"><tbody>${htmlRows}</tbody></table></div>`;
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
  const tableBuffer: string[] = [];

  function flushTable() {
    if (tableBuffer.length) {
      parts.push(renderTable([...tableBuffer]));
      tableBuffer.length = 0;
    }
  }

  for (const line of lines) {
    if (!line.trim()) {
      flushTable();
      continue;
    }

    // Collect consecutive table rows
    if (TABLE_ROW_RE.test(line.trim())) {
      tableBuffer.push(line.trim());
      continue;
    }

    flushTable();

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

  flushTable();

  return parts.join("\n");
}
