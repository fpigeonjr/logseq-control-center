// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/svelte";
import TodayPanel from "../TodayPanel.svelte";
import { mockFetch, restoreFetch } from "../../../../tests/helpers/mockFetch.js";

const TODAY = new Date().toISOString().split("T")[0];

const makeTodayResponse = (overrides = {}) => ({
  date: TODAY,
  page: {
    title: TODAY,
    filePath: `/notes/journals/${TODAY.replace(/-/g, "_")}.md`,
    relativePath: `journals/${TODAY.replace(/-/g, "_")}.md`,
    isJournal: true,
    journalDate: TODAY,
    props: {},
    outgoingLinks: [],
    preview: "Worked on stuff today",
  },
  yesterday: "2026-04-21",
  tomorrow: "2026-04-23",
  ...overrides,
});

const makeContentResponse = (content = "- Worked on [[Project]] today") => ({
  title: TODAY,
  content,
});

afterEach(() => {
  cleanup();
  restoreFetch();
  vi.restoreAllMocks();
});

describe("TodayPanel", () => {
  it("renders today's formatted date", async () => {
    mockFetch({
      "/api/today": makeTodayResponse(),
      "/api/content": makeContentResponse(),
    });

    render(TodayPanel);

    const dateEl = await screen.findByTestId("journal-date");
    expect(dateEl).toBeInTheDocument();
    // Should contain the year at minimum
    expect(dateEl.textContent).toContain("2026");
  });

  it("renders journal body content after loading", async () => {
    mockFetch({
      "/api/today": makeTodayResponse(),
      "/api/content": makeContentResponse("- Finished [[Angular]] module 5"),
    });

    render(TodayPanel);

    const body = await screen.findByTestId("journal-body");
    expect(body).toBeInTheDocument();
    expect(body.textContent).toContain("Angular");
  });

  it("shows empty state when no journal page exists for today", async () => {
    mockFetch({
      "/api/today": makeTodayResponse({ page: null }),
    });

    render(TodayPanel);

    await waitFor(() => {
      expect(screen.getByText(/No journal entry for this day/i)).toBeInTheDocument();
    });
  });

  it("shows prev/next navigation buttons", async () => {
    mockFetch({
      "/api/today": makeTodayResponse(),
      "/api/content": makeContentResponse(),
    });

    render(TodayPanel);

    await screen.findByTestId("journal-date");

    expect(screen.getByLabelText("Previous day")).toBeInTheDocument();
    expect(screen.getByLabelText("Next day")).toBeInTheDocument();
  });

  it("disables Next button when viewing today", async () => {
    mockFetch({
      "/api/today": makeTodayResponse(),
      "/api/content": makeContentResponse(),
    });

    render(TodayPanel);
    await screen.findByTestId("journal-date");

    const nextBtn = screen.getByLabelText("Next day");
    expect(nextBtn).toBeDisabled();
  });

  it("shows error state when API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("Network error")))
    );

    render(TodayPanel);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load journal|Network error/i)).toBeInTheDocument();
    });
  });
});
