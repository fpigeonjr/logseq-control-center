import { describe, it, expect } from "vitest";
import { formatJournalDate, yyyymmddToDisplay, daysSince, isoOffset } from "../format.js";

describe("formatJournalDate", () => {
  it("formats ISO date to long weekday format", () => {
    // 2026-04-22 is a Wednesday
    expect(formatJournalDate("2026-04-22")).toBe("Wednesday, April 22, 2026");
  });

  it("handles month boundaries correctly", () => {
    expect(formatJournalDate("2026-01-01")).toContain("January");
    expect(formatJournalDate("2026-12-31")).toContain("December");
  });
});

describe("yyyymmddToDisplay", () => {
  it("converts YYYYMMDD number to short display string", () => {
    expect(yyyymmddToDisplay(20260422)).toBe("Apr 22, 2026");
  });

  it("handles beginning of year", () => {
    expect(yyyymmddToDisplay(20260101)).toContain("2026");
    expect(yyyymmddToDisplay(20260101)).toContain("Jan");
  });
});

describe("daysSince", () => {
  it("returns 0 for today's date", () => {
    const today = new Date();
    const n =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();
    expect(daysSince(n)).toBe(0);
  });

  it("returns a positive number for past dates", () => {
    // A date that's definitely in the past
    expect(daysSince(20200101)).toBeGreaterThan(0);
  });

  it("never returns a negative number", () => {
    // Future date (far future)
    expect(daysSince(20991231)).toBeGreaterThanOrEqual(0);
  });
});

describe("isoOffset", () => {
  it("returns the previous day", () => {
    expect(isoOffset("2026-04-22", -1)).toBe("2026-04-21");
  });

  it("returns the next day", () => {
    expect(isoOffset("2026-04-22", 1)).toBe("2026-04-23");
  });

  it("handles month boundaries", () => {
    expect(isoOffset("2026-04-01", -1)).toBe("2026-03-31");
    expect(isoOffset("2026-03-31", 1)).toBe("2026-04-01");
  });

  it("handles year boundaries", () => {
    expect(isoOffset("2026-01-01", -1)).toBe("2025-12-31");
    expect(isoOffset("2025-12-31", 1)).toBe("2026-01-01");
  });

  it("returns same day for offset 0", () => {
    expect(isoOffset("2026-04-22", 0)).toBe("2026-04-22");
  });
});
