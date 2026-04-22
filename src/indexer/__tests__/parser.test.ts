import { describe, it, expect } from "vitest";
import { parseLogseqFile, extractLinks, makePreview } from "../parser.js";

// ---------------------------------------------------------------------------
// parseLogseqFile
// ---------------------------------------------------------------------------

describe("parseLogseqFile", () => {
  it("parses a standard PARA project page", () => {
    const raw = `para:: project
created:: 20260422
last-review:: 20260422
status:: active
priority:: high
outcome:: Ship the dashboard

- ## Project Overview
  - This is the body.
`;
    const { props, bodyLines } = parseLogseqFile(raw);

    expect(props["para"]).toBe("project");
    expect(props["created"]).toBe("20260422");
    expect(props["last-review"]).toBe("20260422");
    expect(props["status"]).toBe("active");
    expect(props["priority"]).toBe("high");
    expect(props["outcome"]).toBe("Ship the dashboard");
    // Body starts at the first non-property line (blank lines inside property block are consumed)
    expect(bodyLines[0]).toBe("- ## Project Overview");
    expect(bodyLines.some((l) => l.includes("Project Overview"))).toBe(true);
  });

  it("stops collecting properties at first bullet line", () => {
    const raw = `para:: area
- This is a bullet, not a property
frequency:: monthly
`;
    const { props, bodyLines } = parseLogseqFile(raw);

    expect(props["para"]).toBe("area");
    // frequency:: after a bullet should NOT be parsed as a top-level prop
    expect(props["frequency"]).toBeUndefined();
    expect(bodyLines[0]).toBe("- This is a bullet, not a property");
  });

  it("stops collecting properties at a heading line", () => {
    const raw = `para:: resource
## Heading
last-review:: 20260101
`;
    const { props } = parseLogseqFile(raw);

    expect(props["para"]).toBe("resource");
    expect(props["last-review"]).toBeUndefined();
  });

  it("handles blank lines between properties", () => {
    const raw = `para:: project

status:: planning

priority:: low

- body starts here
`;
    const { props, bodyLines } = parseLogseqFile(raw);

    expect(props["para"]).toBe("project");
    expect(props["status"]).toBe("planning");
    expect(props["priority"]).toBe("low");
    expect(bodyLines[0]).toBe("- body starts here");
  });

  it("returns empty props for a file with no properties", () => {
    const raw = `- Just a bullet note
- Another bullet
`;
    const { props, bodyLines } = parseLogseqFile(raw);

    expect(Object.keys(props)).toHaveLength(0);
    expect(bodyLines[0]).toBe("- Just a bullet note");
  });

  it("handles an empty file", () => {
    const { props, bodyLines } = parseLogseqFile("");
    expect(Object.keys(props)).toHaveLength(0);
    // empty string splits to [""], blank line is consumed by property parser → bodyLines is []
    expect(bodyLines).toEqual([]);
  });

  it("trims whitespace from property values", () => {
    const raw = `para::   project   \nstatus::active\n`;
    const { props } = parseLogseqFile(raw);
    expect(props["para"]).toBe("project");
    expect(props["status"]).toBe("active");
  });

  it("normalizes property keys to lowercase", () => {
    // LogSeq lowercases keys; our parser should match
    const raw = `Para:: project\nLast-Review:: 20260101\n`;
    const { props } = parseLogseqFile(raw);
    expect(props["para"]).toBe("project");
    expect(props["last-review"]).toBe("20260101");
  });

  it("preserves a property value that contains :: in it", () => {
    const raw = `outcome:: Ship by 2026::Q2\n`;
    const { props } = parseLogseqFile(raw);
    // Only the first :: is the delimiter; rest is part of value
    expect(props["outcome"]).toBe("Ship by 2026::Q2");
  });

  it("handles multi-value tags property", () => {
    const raw = `tags:: typescript, svelte, logseq\n- body\n`;
    const { props } = parseLogseqFile(raw);
    expect(props["tags"]).toBe("typescript, svelte, logseq");
  });
});

// ---------------------------------------------------------------------------
// extractLinks
// ---------------------------------------------------------------------------

describe("extractLinks", () => {
  it("extracts [[wikilinks]] from body text", () => {
    const body = `- See [[Active Projects]] and [[Areas]] for more.`;
    const links = extractLinks(body);
    expect(links).toContain("Active Projects");
    expect(links).toContain("Areas");
    expect(links).toHaveLength(2);
  });

  it("deduplicates repeated links", () => {
    const body = `- [[Foo]] is linked here and also [[Foo]] again.`;
    expect(extractLinks(body)).toEqual(["Foo"]);
  });

  it("returns empty array when no links present", () => {
    expect(extractLinks("- No links here.")).toEqual([]);
  });

  it("handles links with special characters", () => {
    const body = `- [[2026-04-22]] and [[AC Checkup 2023-08-03]]`;
    const links = extractLinks(body);
    expect(links).toContain("2026-04-22");
    expect(links).toContain("AC Checkup 2023-08-03");
  });

  it("does not extract partial brackets", () => {
    const body = `- [not a link] and [[real link]]`;
    const links = extractLinks(body);
    expect(links).toEqual(["real link"]);
  });
});

// ---------------------------------------------------------------------------
// makePreview
// ---------------------------------------------------------------------------

describe("makePreview", () => {
  it("strips [[wikilink]] brackets but keeps text", () => {
    const lines = ["- See [[Active Projects]] for details."];
    expect(makePreview(lines)).toContain("Active Projects");
    expect(makePreview(lines)).not.toContain("[[");
  });

  it("strips markdown noise characters", () => {
    const lines = ["# Heading", "**bold** and `code`"];
    const preview = makePreview(lines);
    expect(preview).not.toMatch(/[#*`]/);
  });

  it("truncates to 300 characters", () => {
    const lines = ["-" + " x".repeat(200)];
    expect(makePreview(lines).length).toBeLessThanOrEqual(300);
  });

  it("handles empty body", () => {
    expect(makePreview([])).toBe("");
    expect(makePreview([""])).toBe("");
  });
});
