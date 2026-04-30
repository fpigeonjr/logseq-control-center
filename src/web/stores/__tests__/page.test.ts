import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Must reset module cache between tests so $state re-initialises
const importFresh = async () => {
  const mod = await import("../page.svelte.js?" + Date.now());
  return mod.pageStore;
};

describe("pageStore", () => {
  let store: Awaited<ReturnType<typeof importFresh>>;

  beforeEach(() => {
    vi.stubGlobal("window", {
      location: { hash: "", pathname: "/", search: "" },
    } as unknown as Window & typeof globalThis);
    vi.stubGlobal("history", { replaceState: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to dashboard view", async () => {
    store = await importFresh();
    expect(store.isDashboard).toBe(true);
    expect(store.detailTitle).toBeNull();
  });

  it("opens a detail page and updates view", async () => {
    store = await importFresh();
    store.open("Test Page");
    expect(store.isDashboard).toBe(false);
    expect(store.detailTitle).toBe("Test Page");
  });

  it("closes back to dashboard", async () => {
    store = await importFresh();
    store.open("Test Page");
    store.close();
    expect(store.isDashboard).toBe(true);
    expect(store.detailTitle).toBeNull();
  });

  it("parses detail title from URL hash on init", async () => {
    (window as unknown as { location: { hash: string } }).location.hash = "#/page/My%20Page";
    store = await importFresh();
    expect(store.isDashboard).toBe(false);
    expect(store.detailTitle).toBe("My Page");
  });

  it("ignores non-page hashes", async () => {
    (window as unknown as { location: { hash: string } }).location.hash = "#section-1";
    store = await importFresh();
    expect(store.isDashboard).toBe(true);
  });
});
