/**
 * Minimal LogSeq body renderer — converts raw block text to HTML.
 *
 * Handles the patterns that appear in journal and page bodies:
 *   - `- ` bullet (any indentation depth)
 *   - `[[wikilink]]` → styled span
 *   - `**bold**` → <strong>
 *   - `#tag` → badge span
 *   - `## Heading` inside a bullet → renders as a sub-heading
 *
 * This is NOT a full markdown parser — just enough for readable journals.
 */

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;
const BOLD_RE = /\*\*([^*]+)\*\*/g;
const TAG_RE = /(^|\s)(#[a-zA-Z0-9_/-]+)/g;
const BULLET_RE = /^(\s*)- (.*)/;
const HEADING_RE = /^#{1,4}\s+(.+)/;

function processInline(text: string): string {
  return text
    .replace(WIKILINK_RE, '<span class="wikilink">$1</span>')
    .replace(BOLD_RE, "<strong>$1</strong>")
    .replace(TAG_RE, '$1<span class="journal-tag">$2</span>');
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
      const content = bulletMatch[2];

      // A bullet that starts with ## is a section heading inside a block
      const headingMatch = content.match(HEADING_RE);
      if (headingMatch) {
        parts.push(
          `<div class="journal-heading" style="margin-left:${depth * 16}px">${processInline(headingMatch[1])}</div>`
        );
      } else {
        parts.push(
          `<div class="journal-bullet" style="margin-left:${depth * 16}px">${processInline(content)}</div>`
        );
      }
    } else if (line.trim()) {
      parts.push(`<div class="journal-line">${processInline(line.trim())}</div>`);
    }
  }

  return parts.join("\n");
}
