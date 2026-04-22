// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/svelte";
import AreasPanel from "../AreasPanel.svelte";
import { mockFetch, restoreFetch } from "../../../../tests/helpers/mockFetch.js";

const makeArea = (overrides = {}) => ({
  title: "Test Area",
  filePath: "/notes/pages/Test Area.md",
  relativePath: "pages/Test Area.md",
  isJournal: false,
  props: {},
  para: "area",
  frequency: "monthly",
  lastReview: 20260101,
  responsibility: "Keep things in order",
  outgoingLinks: [],
  preview: "An area of responsibility",
  ...overrides,
});

const makeAreasResponse = (overrides = {}) => ({
  overdue: [
    makeArea({ title: "Home", lastReview: 20250911, frequency: "quarterly" }),
    makeArea({ title: "Health", lastReview: 20260323, frequency: "monthly" }),
  ],
  upcoming: [
    makeArea({ title: "Finances", lastReview: 20260418, frequency: "weekly" }),
  ],
  ok: [makeArea({ title: "Band", lastReview: 20260412, frequency: "monthly" })],
  ...overrides,
});

afterEach(() => {
  cleanup();
  restoreFetch();
  vi.restoreAllMocks();
});

describe("AreasPanel", () => {
  it("renders overdue areas", async () => {
    mockFetch({ "/api/areas": makeAreasResponse() });
    render(AreasPanel);

    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Health")).toBeInTheDocument();
    });
  });

  it("renders upcoming areas", async () => {
    mockFetch({ "/api/areas": makeAreasResponse() });
    render(AreasPanel);

    await screen.findByText("Finances");
    expect(screen.getByText("Finances")).toBeInTheDocument();
  });

  it("renders ok areas by default", async () => {
    mockFetch({ "/api/areas": makeAreasResponse() });
    render(AreasPanel);

    await screen.findByText("Band");
    expect(screen.getByText("Band")).toBeInTheDocument();
  });

  it("shows overdue count badge", async () => {
    mockFetch({ "/api/areas": makeAreasResponse() });
    render(AreasPanel);

    const count = await screen.findByTestId("overdue-count");
    expect(count.textContent).toContain("2");
  });

  it("shows upcoming count badge", async () => {
    mockFetch({ "/api/areas": makeAreasResponse() });
    render(AreasPanel);

    const count = await screen.findByTestId("upcoming-count");
    expect(count.textContent).toContain("1");
  });

  it("does not show overdue badge when none are overdue", async () => {
    mockFetch({
      "/api/areas": makeAreasResponse({ overdue: [] }),
    });
    render(AreasPanel);

    await screen.findByText("Finances");
    expect(screen.queryByTestId("overdue-count")).not.toBeInTheDocument();
  });

  it("shows 'overdue' badge on overdue area cards", async () => {
    mockFetch({ "/api/areas": makeAreasResponse() });
    render(AreasPanel);

    await screen.findByText("Home");
    const overdueBadges = screen.getAllByTestId("badge-overdue");
    expect(overdueBadges.length).toBeGreaterThan(0);
  });

  it("shows area cards with data-testid", async () => {
    mockFetch({ "/api/areas": makeAreasResponse() });
    render(AreasPanel);

    await screen.findByText("Home");
    const cards = screen.getAllByTestId("area-card");
    // 2 overdue + 1 upcoming + 1 ok = 4 total
    expect(cards.length).toBe(4);
  });

  it("renders area with 'Never reviewed' when lastReview is missing", async () => {
    mockFetch({
      "/api/areas": makeAreasResponse({
        overdue: [makeArea({ title: "New Area", lastReview: undefined })],
      }),
    });
    render(AreasPanel);

    await screen.findByText("New Area");
    expect(screen.getByText(/Never reviewed/i)).toBeInTheDocument();
  });

  it("shows error when API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("Failed")))
    );
    render(AreasPanel);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load areas|Failed/i)).toBeInTheDocument();
    });
  });
});
