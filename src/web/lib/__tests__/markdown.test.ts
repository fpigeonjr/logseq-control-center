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
});
