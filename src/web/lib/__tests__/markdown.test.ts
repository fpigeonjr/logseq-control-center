import { describe, it, expect } from "vitest";
import { renderJournalBody } from "../markdown.js";

describe("renderJournalBody", () => {
  it("renders a simple bullet as a journal-bullet div", () => {
    const html = renderJournalBody("- Hello world");
    expect(html).toContain("journal-bullet");
    expect(html).toContain("Hello world");
  });

  it("converts [[wikilinks]] to wikilink spans", () => {
    const html = renderJournalBody("- See [[Active Projects]] today");
    expect(html).toContain('<span class="wikilink">Active Projects</span>');
    expect(html).not.toContain("[[");
  });

  it("converts **bold** to <strong>", () => {
    const html = renderJournalBody("- This is **important**");
    expect(html).toContain("<strong>important</strong>");
  });

  it("converts #tags to journal-tag spans", () => {
    const html = renderJournalBody("- A note #typescript #svelte");
    expect(html).toContain('<span class="journal-tag">#typescript</span>');
    expect(html).toContain('<span class="journal-tag">#svelte</span>');
  });

  it("renders a bare ## heading line (not inside a bullet)", () => {
    const html = renderJournalBody("## Fleeting Thoughts");
    expect(html).toContain("journal-heading");
    expect(html).toContain("Fleeting Thoughts");
    expect(html).not.toContain("journal-line");
  });

  it("renders inline backtick code as inline-code span", () => {
    const html = renderJournalBody("- run `npm install` first");
    expect(html).toContain('<code class="inline-code">npm install</code>');
  });

  // ── Task states ────────────────────────────────────────────

  it("renders TODO bullet with task-todo class and badge", () => {
    const html = renderJournalBody("- TODO angular training");
    expect(html).toContain("task-todo");
    expect(html).toContain("task-badge");
    expect(html).toContain("angular training");
    expect(html).not.toContain("task-strike");
  });

  it("handles TODO: with colon variant", () => {
    const html = renderJournalBody("- TODO: finish report");
    expect(html).toContain("task-todo");
    expect(html).toContain("finish report");
  });

  it("renders DOING bullet with task-doing class", () => {
    const html = renderJournalBody("- DOING [[OPS Closeout Plan]] work");
    expect(html).toContain("task-doing");
    expect(html).toContain("wikilink");
  });

  it("renders DONE bullet with strikethrough", () => {
    const html = renderJournalBody("- DONE wake up by 6 AM");
    expect(html).toContain("task-done");
    expect(html).toContain("task-strike");
    expect(html).toContain("wake up by 6 AM");
  });

  it("renders LATER, WAITING, CANCELLED with muted styling", () => {
    expect(renderJournalBody("- LATER review backlog")).toContain("task-later");
    expect(renderJournalBody("- WAITING on design review")).toContain("task-waiting");
    expect(renderJournalBody("- CANCELLED old idea")).toContain("task-cancelled");
  });

  it("renders CANCELLED bullet with strikethrough", () => {
    const html = renderJournalBody("- CANCELLED dropped idea");
    expect(html).toContain("task-strike");
  });

  it("renders NOW with danger/red styling", () => {
    const html = renderJournalBody("- NOW urgent fix");
    expect(html).toContain("task-now");
  });

  it("task keywords in indented bullets preserve depth", () => {
    const html = renderJournalBody("  - DONE nested task");
    expect(html).toContain("margin-left:16px");
    expect(html).toContain("task-done");
  });

  it("renders headings inside bullets as journal-heading divs", () => {
    const html = renderJournalBody("- ## Section Title");
    expect(html).toContain("journal-heading");
    expect(html).toContain("Section Title");
  });

  it("indents nested bullets using margin-left", () => {
    const html = renderJournalBody("  - nested bullet");
    expect(html).toContain("margin-left:16px");
  });

  it("skips empty lines without adding markup", () => {
    const html = renderJournalBody("- line one\n\n- line two");
    const matches = html.match(/journal-bullet/g) ?? [];
    expect(matches.length).toBe(2);
  });

  it("returns empty-journal paragraph for blank input", () => {
    expect(renderJournalBody("")).toContain("empty-journal");
    expect(renderJournalBody("   ")).toContain("empty-journal");
  });

  it("handles multiple wikilinks in one bullet", () => {
    const html = renderJournalBody("- [[GSA]] and [[Angular]] work");
    expect(html).toContain('<span class="wikilink">GSA</span>');
    expect(html).toContain('<span class="wikilink">Angular</span>');
  });

  it("does not double-encode HTML in plain text", () => {
    const html = renderJournalBody("- Just plain text, no special chars");
    expect(html).toContain("Just plain text");
    expect(html).not.toContain("&amp;");
  });

  // ── Markdown links ─────────────────────────────────────────

  it("converts [text](url) to an <a> link", () => {
    const html = renderJournalBody("- See [PR #123](https://github.com/org/repo/pull/123)");
    expect(html).toContain('<a class="md-link"');
    expect(html).toContain('href="https://github.com/org/repo/pull/123"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain("PR #123");
    expect(html).not.toContain("](https://");
  });

  it("handles multiple markdown links in one bullet", () => {
    const html = renderJournalBody(
      "- [feat A](https://github.com/a/b/pull/1), [fix B](https://github.com/a/b/pull/2)"
    );
    expect(html.match(/md-link/g)).toHaveLength(2);
  });

  it("does not turn [[wikilinks]] into md-links", () => {
    const html = renderJournalBody("- [[Active Projects]]");
    expect(html).toContain("wikilink");
    expect(html).not.toContain("md-link");
  });

  // ── Pipe tables ────────────────────────────────────────────

  it("renders a markdown table as journal-table", () => {
    const md = `| Col A | Col B |\n|-------|-------|\n| foo   | bar   |`;
    const html = renderJournalBody(md);
    expect(html).toContain("table-wrapper");
    expect(html).toContain("journal-table");
    expect(html).toContain("<td>foo</td>");
    expect(html).toContain("<td>bar</td>");
    // separator row should be stripped
    expect(html).not.toContain("-------");
  });

  it("skips table separator rows (|---|)", () => {
    const md = `| A | B |\n|---|---|\n| 1 | 2 |`;
    const html = renderJournalBody(md);
    const rows = html.match(/<tr>/g) ?? [];
    // header row + data row = 2 rows (separator stripped)
    expect(rows).toHaveLength(2);
  });

  it("applies processInline inside table cells", () => {
    const md = `| **bold** | [[Link]] |\n|---|---|`;
    const html = renderJournalBody(md);
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('<span class="wikilink">Link</span>');
  });
});
