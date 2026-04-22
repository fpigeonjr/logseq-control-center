<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../lib/api.js";
  import { daysSince, yyyymmddToDisplay } from "../lib/format.js";
  import type { AreasResponse, NotePage } from "../../shared/types.js";

  let data = $state<AreasResponse | null>(null);
  let error = $state<string | null>(null);
  let showOk = $state(true);

  onMount(async () => {
    try {
      data = await api<AreasResponse>("/areas");
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load areas";
    }
  });

  function daysLabel(page: NotePage): string {
    if (!page.lastReview) return "Never reviewed";
    const d = daysSince(page.lastReview);
    if (d === 0) return "Reviewed today";
    if (d === 1) return "Reviewed yesterday";
    return `${d}d ago`;
  }
</script>

<div class="areas-section" data-testid="areas-panel">
  <div class="section-header">
    <h2 class="section-title">🗂 Areas</h2>
    {#if data}
      {#if data.overdue.length > 0}
        <span class="section-count danger" data-testid="overdue-count">
          {data.overdue.length} overdue
        </span>
      {/if}
      {#if data.upcoming.length > 0}
        <span class="section-count warning" data-testid="upcoming-count">
          {data.upcoming.length} due soon
        </span>
      {/if}
    {/if}
  </div>

  {#if error}
    <p class="panel-error">⚠ {error}</p>
  {:else if !data}
    <div class="areas-grid">
      {#each [0, 1, 2, 3, 4, 5] as _}
        <div class="area-card skeleton"></div>
      {/each}
    </div>
  {:else}
    <div class="areas-grid" data-testid="areas-grid">
      <!-- Overdue -->
      {#each data.overdue as area (area.title)}
        <div class="area-card overdue" data-testid="area-card">
          <div class="area-top">
            <span class="area-title">{area.title}</span>
            <div class="badges">
              <span class="badge badge-danger" data-testid="badge-overdue">
                {#if area.lastReview}
                  {daysSince(area.lastReview)}d overdue
                {:else}
                  Never reviewed
                {/if}
              </span>
              {#if area.frequency}
                <span class="badge badge-muted">{area.frequency}</span>
              {/if}
            </div>
          </div>
          {#if area.responsibility}
            <div class="area-desc">{area.responsibility}</div>
          {/if}
          {#if area.lastReview}
            <div class="area-meta">last reviewed {yyyymmddToDisplay(area.lastReview)}</div>
          {/if}
        </div>
      {/each}

      <!-- Upcoming -->
      {#each data.upcoming as area (area.title)}
        <div class="area-card upcoming" data-testid="area-card">
          <div class="area-top">
            <span class="area-title">{area.title}</span>
            <div class="badges">
              <span class="badge badge-warning">due soon</span>
              {#if area.frequency}
                <span class="badge badge-muted">{area.frequency}</span>
              {/if}
            </div>
          </div>
          {#if area.responsibility}
            <div class="area-desc">{area.responsibility}</div>
          {/if}
          <div class="area-meta">{daysLabel(area)}</div>
        </div>
      {/each}

      <!-- OK -->
      {#if showOk}
        {#each data.ok as area (area.title)}
          <div class="area-card ok" data-testid="area-card">
            <div class="area-top">
              <span class="area-title">{area.title}</span>
              <div class="badges">
                <span class="badge badge-success">OK</span>
                {#if area.frequency}
                  <span class="badge badge-muted">{area.frequency}</span>
                {/if}
              </div>
            </div>
            {#if area.responsibility}
              <div class="area-desc">{area.responsibility}</div>
            {/if}
            <div class="area-meta">{daysLabel(area)}</div>
          </div>
        {/each}
      {/if}
    </div>

    {#if data.ok.length > 0}
      <button
        class="toggle-ok"
        onclick={() => (showOk = !showOk)}
        aria-expanded={showOk}
      >
        {showOk ? "▾ Hide" : "▸ Show"} {data.ok.length} OK area{data.ok.length === 1 ? "" : "s"}
      </button>
    {/if}
  {/if}
</div>

<style>
  .areas-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--muted);
    flex: 1;
    margin: 0;
  }

  .section-count {
    font-size: 10px;
    padding: 1px 7px;
    border-radius: 10px;
    border: 1px solid;
  }

  .section-count.danger {
    background: rgba(243, 139, 168, 0.15);
    border-color: rgba(243, 139, 168, 0.3);
    color: var(--danger);
  }

  .section-count.warning {
    background: rgba(250, 179, 135, 0.15);
    border-color: rgba(250, 179, 135, 0.3);
    color: var(--warning);
  }

  .areas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 10px;
  }

  .area-card {
    background: var(--surface-raised);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .area-card:hover { border-color: rgba(124, 106, 247, 0.3); }
  .area-card.overdue  { border-left: 3px solid var(--danger); }
  .area-card.upcoming { border-left: 3px solid var(--warning); }
  .area-card.ok       { border-left: 3px solid var(--success); }
  .area-card.skeleton {
    height: 80px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .area-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 4px;
  }

  .area-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
  }

  .area-desc {
    font-size: 11px;
    color: var(--text-dim);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
    margin-bottom: 5px;
  }

  .area-meta {
    font-size: 10px;
    color: var(--muted);
  }

  .badges { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; flex-shrink: 0; }

  .badge {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 2px 6px;
    border-radius: 6px;
  }
  .badge-danger  { background: rgba(243,139,168,0.18); color: var(--danger); }
  .badge-warning { background: rgba(250,179,135,0.18); color: var(--warning); }
  .badge-success { background: rgba(166,227,161,0.18); color: var(--success); }
  .badge-muted   { background: rgba(108,108,138,0.18); color: var(--muted); }

  .toggle-ok {
    background: none;
    border: none;
    font-family: var(--font);
    font-size: 11px;
    color: var(--muted);
    cursor: pointer;
    padding: 2px 0;
    transition: color 0.15s;
  }
  .toggle-ok:hover { color: var(--accent); }

  .panel-error {
    color: var(--danger);
    font-size: 12px;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
