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
        <span class="count-badge danger" data-testid="overdue-count">
          {data.overdue.length} overdue
        </span>
      {/if}
      {#if data.upcoming.length > 0}
        <span class="count-badge warning" data-testid="upcoming-count">
          {data.upcoming.length} due soon
        </span>
      {/if}
    {/if}
  </div>

  {#if error}
    <p class="state-error">⚠ {error}</p>
  {:else if !data}
    <div class="areas-grid">
      {#each [0, 1, 2, 3, 4, 5] as _}
        <div class="skeleton" style="height:80px;border-radius:12px;"></div>
      {/each}
    </div>
  {:else}
    <div class="areas-grid" data-testid="areas-grid">
      {#each data.overdue as area (area.title)}
        <div class="area-card overdue" data-testid="area-card">
          <div class="area-top">
            <span class="area-title">{area.title}</span>
            <div class="badges">
              <span class="badge badge-danger" data-testid="badge-overdue">
                {area.lastReview ? `${daysSince(area.lastReview)}d overdue` : "Never reviewed"}
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
      <button class="toggle-ok" onclick={() => (showOk = !showOk)} aria-expanded={showOk}>
        {showOk ? "▾ Hide" : "▸ Show"}
        {data.ok.length} OK area{data.ok.length === 1 ? "" : "s"}
      </button>
    {/if}
  {/if}
</div>

<style>
  .areas-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    flex: 1;
    margin: 0;
  }

  .count-badge {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 10px;
    border: 1px solid;
  }

  .count-badge.danger {
    background: rgba(243, 139, 168, 0.12);
    border-color: rgba(243, 139, 168, 0.28);
    color: var(--danger);
  }

  .count-badge.warning {
    background: rgba(250, 179, 135, 0.12);
    border-color: rgba(250, 179, 135, 0.28);
    color: var(--warning);
  }

  .areas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 10px;
  }

  .area-card {
    background: var(--surface-raised);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    padding: 12px 14px;
    cursor: pointer;
    overflow: hidden;
    transition:
      border-color var(--transition-fast),
      transform var(--transition-fast);
  }

  .area-card:hover {
    border-color: rgba(124, 106, 247, 0.28);
    transform: translateY(-1px);
  }

  .area-card.overdue {
    border-left: 3px solid var(--danger);
  }
  .area-card.upcoming {
    border-left: 3px solid var(--warning);
  }
  .area-card.ok {
    border-left: 3px solid var(--success);
  }

  .area-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 5px;
    min-width: 0;
  }

  .area-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    transition: color var(--transition-fast);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .area-card:hover .area-title {
    color: var(--accent-hover);
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

  .badges {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: flex-end;
    flex-shrink: 0;
    max-width: 55%;
  }

  .badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 6px;
    border-radius: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }

  .badge-danger {
    background: rgba(243, 139, 168, 0.18);
    color: var(--danger);
  }
  .badge-warning {
    background: rgba(250, 179, 135, 0.18);
    color: var(--warning);
  }
  .badge-success {
    background: rgba(166, 227, 161, 0.18);
    color: var(--success);
  }
  .badge-muted {
    background: rgba(108, 108, 138, 0.15);
    color: var(--muted);
  }

  .toggle-ok {
    background: none;
    border: none;
    font-family: var(--font);
    font-size: 11px;
    color: var(--muted);
    cursor: pointer;
    padding: 2px 0;
    transition: color var(--transition-fast);
    align-self: flex-start;
  }

  .toggle-ok:hover {
    color: var(--accent);
  }

  .state-error {
    color: var(--danger);
    font-size: 12px;
  }

  @media (max-width: 480px) {
    .areas-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
