<script lang="ts">
  import { api } from "./lib/api.js";
  import { layoutStore } from "./stores/layout.svelte.js";
  import Nav from "./lib/Nav.svelte";
  import StatsBar from "./lib/StatsBar.svelte";
  import TodayPanel from "./panels/TodayPanel.svelte";
  import ProjectsPanel from "./panels/ProjectsPanel.svelte";
  import AreasPanel from "./panels/AreasPanel.svelte";

  async function handleRandomNote() {
    try {
      const res = await api<{ page: { title: string } }>("/random");
      // M4 will add client-side routing; for now open as a browser alert / log
      console.log("Random note:", res.page.title);
      // TODO: navigate to page detail view in M4
      window.alert(`Random note: ${res.page.title}`);
    } catch {
      /* ignore */
    }
  }
</script>

<div class="app" data-testid="app" data-layout={layoutStore.value}>
  <Nav onRandomNote={handleRandomNote} />
  <StatsBar />

  {#if layoutStore.value === "b"}
    <!-- ── Layout B: Today-first (default) ────────────────────── -->
    <main class="layout-b">
      <div class="top-grid">
        <TodayPanel />
        <ProjectsPanel />
      </div>
      <AreasPanel />
    </main>
  {:else}
    <!-- ── Layout A: Review-first ──────────────────────────────── -->
    <main class="layout-a">
      <AreasPanel />
      <ProjectsPanel />
      <TodayPanel />
    </main>
  {/if}
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ── Layout B ────────────────────────────────────────── */
  .layout-b {
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .top-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    align-items: start;
  }

  /* ── Layout A ────────────────────────────────────────── */
  .layout-a {
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* ── Responsive ──────────────────────────────────────── */
  @media (max-width: 720px) {
    .top-grid {
      grid-template-columns: 1fr;
    }

    .layout-b,
    .layout-a {
      padding: 12px;
      gap: 16px;
    }
  }
</style>
