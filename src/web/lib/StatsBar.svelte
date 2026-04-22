<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "./api.js";
  import type { StatsResponse } from "../../shared/types.js";

  let stats = $state<StatsResponse | null>(null);
  let error = $state(false);

  async function load() {
    try {
      stats = await api<StatsResponse>("/stats");
      error = false;
    } catch {
      error = true;
    }
  }

  onMount(() => {
    load();

    const interval = setInterval(load, 60_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  });
</script>

<div class="stats-bar" role="region" aria-label="Graph statistics">
  {#if stats}
    <div class="stat-card">
      <div class="num accent" data-testid="stat-active-projects">
        {stats.activeProjects}
      </div>
      <div class="label">Active Projects</div>
    </div>

    <div class="stat-card">
      <div
        class="num"
        class:danger={stats.overdueAreas > 0}
        class:success={stats.overdueAreas === 0}
        data-testid="stat-overdue-areas"
      >
        {stats.overdueAreas}
      </div>
      <div class="label">Areas Overdue</div>
    </div>

    <div class="stat-card">
      <div class="num neutral" data-testid="stat-pages">
        {stats.totalPages.toLocaleString()}
      </div>
      <div class="label">Pages</div>
    </div>

    <div class="stat-card">
      <div class="num neutral" data-testid="stat-journals">
        {stats.totalJournals.toLocaleString()}
      </div>
      <div class="label">Journals</div>
    </div>
  {:else if error}
    <div class="stats-error">⚠ Could not load stats</div>
  {:else}
    {#each [0, 1, 2, 3] as _}
      <div class="stat-card">
        <div class="skeleton" style="height:22px;width:40px;margin:0 auto 4px;"></div>
        <div class="skeleton" style="height:10px;width:70%;margin:0 auto;"></div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .stats-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--surface-raised);
  }

  .stat-card {
    background: var(--surface-overlay);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 14px;
    text-align: center;
    transition: border-color var(--transition-fast);
  }

  .stat-card:hover {
    border-color: rgba(124, 106, 247, 0.2);
  }

  .num {
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .num.accent {
    color: var(--accent);
  }
  .num.danger {
    color: var(--danger);
  }
  .num.success {
    color: var(--success);
  }
  .num.neutral {
    color: var(--text-dim);
  }

  .label {
    font-size: 10px;
    color: var(--muted);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .stats-error {
    grid-column: 1 / -1;
    text-align: center;
    font-size: 12px;
    color: var(--danger);
    padding: 12px;
  }

  @media (max-width: 480px) {
    .stats-bar {
      grid-template-columns: repeat(2, 1fr);
      padding: 10px 12px;
    }
  }
</style>
