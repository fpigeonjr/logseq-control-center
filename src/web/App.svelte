<script lang="ts">
  import { fade } from "svelte/transition";
  import { api } from "./lib/api.js";
  import { layoutStore } from "./stores/layout.svelte.js";
  import Nav from "./lib/Nav.svelte";
  import StatsBar from "./lib/StatsBar.svelte";
  import TodayPanel from "./panels/TodayPanel.svelte";
  import ProjectsPanel from "./panels/ProjectsPanel.svelte";
  import AreasPanel from "./panels/AreasPanel.svelte";

  let randomToast = $state<string | null>(null);
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  async function handleRandomNote() {
    try {
      const res = await api<{ page: { title: string } }>("/random");
      if (toastTimer) clearTimeout(toastTimer);
      randomToast = res.page.title;
      toastTimer = setTimeout(() => (randomToast = null), 3500);
    } catch {
      /* ignore */
    }
  }
</script>

<svelte:head>
  <title>🧠 LogSeq Control Center</title>
</svelte:head>

<div class="app" data-testid="app" data-layout={layoutStore.value}>
  <Nav onRandomNote={handleRandomNote} />
  <StatsBar />

  {#if layoutStore.value === "b"}
    <!-- ── Layout B: Today-first (default) ──────────────── -->
    <main class="layout-b lcc-fade-in">
      <div class="top-grid">
        <TodayPanel />
        <ProjectsPanel />
      </div>
      <AreasPanel />
    </main>
  {:else}
    <!-- ── Layout A: Review-first ────────────────────────── -->
    <main class="layout-a lcc-fade-in">
      <AreasPanel />
      <ProjectsPanel />
      <TodayPanel />
    </main>
  {/if}
</div>

<!-- Random note toast -->
{#if randomToast}
  <div class="toast" transition:fade={{ duration: 200 }}>
    🎲 <strong>{randomToast}</strong>
  </div>
{/if}

<style>
  .app {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  /* ── Layout B ──────────────────────────────────────────── */
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

  /* ── Layout A ──────────────────────────────────────────── */
  .layout-a {
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* ── Responsive ────────────────────────────────────────── */
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
