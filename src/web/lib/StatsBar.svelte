<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "./api.js";
  import type { StatsResponse } from "../../shared/types.js";

  let stats = $state<StatsResponse | null>(null);
  let error = $state(false);

  onMount(async () => {
    try {
      stats = await api<StatsResponse>("/stats");
    } catch {
      error = true;
    }
  });

  // Auto-refresh every 60s or on window focus
  onMount(() => {
    const interval = setInterval(async () => {
      try {
        stats = await api<StatsResponse>("/stats");
      } catch {
        /* silent refresh failure */
      }
    }, 60_000);

    const onFocus = async () => {
      try {
        stats = await api<StatsResponse>("/stats");
      } catch {
        /* silent */
      }
    };
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
      <div class="num accent" data-testid="stat-active-projects">{stats.activeProjects}</div>
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
      <div class="num neutral" data-testid="stat-pages">{stats.totalPages.toLocaleString()}</div>
      <div class="label">Pages</div>
    </div>
    <div class="stat-card">
      <div class="num neutral" data-testid="stat-journals">{stats.totalJournals.toLocaleString()}</div>
      <div class="label">Journals</div>
    </div>
  {:else if error}
    <div class="stats-error">⚠ Could not load stats</div>
  {:else}
    {#each [0, 1, 2, 3] as _}
      <div class="stat-card skeleton"></div>
    {/each}
  {/if}
</div>

<style>
  .stats-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--surface-raised);
  }

  .stat-card {
    background: var(--surface-overlay);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 14px;
    text-align: center;
  }

  .stat-card.skeleton {
    height: 56px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .num {
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
  }

  .num.accent   { color: var(--accent); }
  .num.danger   { color: var(--danger); }
  .num.success  { color: var(--success); }
  .num.neutral  { color: var(--text-dim); }

  .label {
    font-size: 10px;
    color: var(--muted);
    margin-top: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stats-error {
    grid-column: 1 / -1;
    text-align: center;
    font-size: 12px;
    color: var(--danger);
    padding: 12px;
  }
</style>
