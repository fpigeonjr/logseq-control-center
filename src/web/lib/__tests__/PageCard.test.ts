// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import PageCard from "../PageCard.svelte";

const makePage = (overrides = {}) => ({
  title: "Test Page",
  filePath: "/notes/pages/Test Page.md",
  relativePath: "pages/Test Page.md",
  isJournal: false,
  props: {},
  outgoingLinks: [],
  preview: "Preview text",
  ...overrides,
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PageCard", () => {
  it("renders page title and preview", () => {
    render(PageCard, { props: { page: makePage() } });

    expect(screen.getByText("Test Page")).toBeInTheDocument();
    expect(screen.getByText("Preview text")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(PageCard, { props: { page: makePage(), onClick } });

    const card = screen.getByTestId("page-card");
    await user.click(card);

    expect(onClick).toHaveBeenCalledWith("Test Page");
  });

  it("calls onClick on Enter key", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(PageCard, { props: { page: makePage(), onClick } });

    const card = screen.getByTestId("page-card");
    card.focus();
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledWith("Test Page");
  });

  it("does not break when onClick is omitted", async () => {
    const user = userEvent.setup();
    render(PageCard, { props: { page: makePage() } });

    const card = screen.getByTestId("page-card");
    await user.click(card);
    // should not throw
    expect(card).toBeInTheDocument();
  });

  it("renders status and priority badges when showMeta is true", () => {
    render(PageCard, {
      props: {
        page: makePage({ status: "active", priority: "high" }),
        showMeta: true,
      },
    });

    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
  });

  it("hides badges when showMeta is false", () => {
    render(PageCard, {
      props: {
        page: makePage({ status: "active", priority: "high" }),
        showMeta: false,
      },
    });

    expect(screen.queryByText("active")).not.toBeInTheDocument();
    expect(screen.queryByText("high")).not.toBeInTheDocument();
  });
});
