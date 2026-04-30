// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/svelte";
import PageDetail from "../PageDetail.svelte";
import { mockFetch, restoreFetch } from "../../../../tests/helpers/mockFetch.js";

const makePage = (overrides = {}) => ({
  title: "Test Page",
  filePath: "/notes/pages/Test Page.md",
  relativePath: "pages/Test Page.md",
  isJournal: false,
  props: {},
  para: "project",
  status: "active",
  priority: "high",
  frequency: "monthly",
  created: 20260401,
  lastReview: 20260415,
  outcome: "Ship the feature",
  responsibility: "",
  outgoingLinks: [],
  preview: "Some preview text",
  ...overrides,
});

afterEach(() => {
  cleanup();
  restoreFetch();
  vi.restoreAllMocks();
});

describe("PageDetail", () => {
  it("renders page title and badges", async () => {
    mockFetch({
      "/api/page/Test%20Page": {
        page: makePage(),
        backlinks: [],
      },
      "/api/content/Test%20Page": {
        title: "Test Page",
        content: "- First bullet\n- Second bullet",
      },
    });

    render(PageDetail, { props: { title: "Test Page" } });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Test Page" })).toBeInTheDocument();
    });

    expect(screen.getByText("project")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("Ship the feature")).toBeInTheDocument();
  });

  it("renders backlinks", async () => {
    mockFetch({
      "/api/page/Test%20Page": {
        page: makePage(),
        backlinks: [makePage({ title: "Linked Page", status: undefined, para: undefined })],
      },
      "/api/content/Test%20Page": {
        title: "Test Page",
        content: "",
      },
    });

    render(PageDetail, { props: { title: "Test Page" } });

    await waitFor(() => {
      expect(screen.getByText("Linked from · 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Linked Page")).toBeInTheDocument();
  });

  it("shows error state when API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("Server down")))
    );

    render(PageDetail, { props: { title: "Test Page" } });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load page|Server down/i)).toBeInTheDocument();
    });
  });

  it("shows skeleton while loading", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    );

    render(PageDetail, { props: { title: "Test Page" } });

    expect(screen.queryByRole("heading", { name: "Test Page" })).not.toBeInTheDocument();
    expect(screen.getByTestId("page-detail")).toBeInTheDocument();
  });
});
