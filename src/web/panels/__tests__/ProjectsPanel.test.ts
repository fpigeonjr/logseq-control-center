// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import ProjectsPanel from "../ProjectsPanel.svelte";
import { mockFetch, restoreFetch } from "../../../../tests/helpers/mockFetch.js";

const makeProject = (overrides = {}) => ({
  title: "Test Project",
  filePath: "/notes/pages/Test Project.md",
  relativePath: "pages/Test Project.md",
  isJournal: false,
  props: {},
  para: "project",
  status: "active",
  priority: "high",
  outgoingLinks: [],
  preview: "Build something cool",
  outcome: "Ship it",
  ...overrides,
});

const makeProjectsResponse = (overrides = {}) => ({
  active: [
    makeProject({ title: "GSA", priority: "high" }),
    makeProject({ title: "Angular", priority: "medium" }),
  ],
  planning: [makeProject({ title: "Make a Will", status: "planning" })],
  completed: [makeProject({ title: "Atlas", status: "completed" })],
  ...overrides,
});

afterEach(() => {
  cleanup();
  restoreFetch();
  vi.restoreAllMocks();
});

describe("ProjectsPanel", () => {
  it("renders active projects", async () => {
    mockFetch({ "/api/projects": makeProjectsResponse() });

    render(ProjectsPanel);

    await waitFor(() => {
      expect(screen.getByText("GSA")).toBeInTheDocument();
      expect(screen.getByText("Angular")).toBeInTheDocument();
    });
  });

  it("renders planning projects", async () => {
    mockFetch({ "/api/projects": makeProjectsResponse() });
    render(ProjectsPanel);

    await screen.findByText("Make a Will");
    expect(screen.getByText("Make a Will")).toBeInTheDocument();
  });

  it("shows project count in header", async () => {
    mockFetch({ "/api/projects": makeProjectsResponse() });
    render(ProjectsPanel);

    const count = await screen.findByTestId("projects-count");
    expect(count.textContent).toContain("2 active");
    expect(count.textContent).toContain("1 planning");
  });

  it("hides completed projects by default", async () => {
    mockFetch({ "/api/projects": makeProjectsResponse() });
    render(ProjectsPanel);

    await screen.findByText("GSA");
    expect(screen.queryByText("Atlas")).not.toBeInTheDocument();
  });

  it("expands completed projects on toggle click", async () => {
    const user = userEvent.setup();
    mockFetch({ "/api/projects": makeProjectsResponse() });
    render(ProjectsPanel);

    await screen.findByText("GSA");
    const toggle = screen.getByText(/Show 1 completed project/i);
    await user.click(toggle);

    expect(screen.getByText("Atlas")).toBeInTheDocument();
  });

  it("shows empty state when no projects exist", async () => {
    mockFetch({
      "/api/projects": { active: [], planning: [], completed: [] },
    });
    render(ProjectsPanel);

    await waitFor(() => {
      expect(screen.getByText(/No active or planned projects/i)).toBeInTheDocument();
    });
  });

  it("shows loading skeletons initially", () => {
    // Don't resolve fetch — panel should show skeletons
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(ProjectsPanel);

    // Panel renders but no project titles yet
    expect(screen.queryByText("GSA")).not.toBeInTheDocument();
  });

  it("shows error state when API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("Server down")))
    );
    render(ProjectsPanel);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load projects|Server down/i)).toBeInTheDocument();
    });
  });
});
