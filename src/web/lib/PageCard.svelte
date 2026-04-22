<script lang="ts">
  import type { NotePage } from "../../shared/types.js";
  import { yyyymmddToDisplay } from "./format.js";

  let { page, showMeta = true }: { page: NotePage; showMeta?: boolean } = $props();

  const statusColor: Record<string, string> = {
    active: "badge-success",
    planning: "badge-accent",
    completed: "badge-muted",
  };
</script>

<div class="card" role="button" tabindex="0" aria-label={page.title} data-testid="page-card">
  <div class="card-top">
    <span class="card-title">{page.title}</span>
    {#if showMeta}
      <div class="badges">
        {#if page.priority === "high"}
          <span class="badge badge-danger">high</span>
        {/if}
        {#if page.status}
          <span class="badge {statusColor[page.status] ?? 'badge-muted'}">{page.status}</span>
        {/if}
      </div>
    {/if}
  </div>

  {#if page.outcome}
    <p class="card-desc">{page.outcome}</p>
  {:else if page.preview}
    <p class="card-desc">{page.preview}</p>
  {/if}

  {#if page.lastReview}
    <p class="card-meta">reviewed {yyyymmddToDisplay(page.lastReview)}</p>
  {/if}
</div>

<style>
  .card {
    background: var(--surface-overlay);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: var(--radius-card);
    padding: 10px 12px;
    cursor: pointer;
    transition:
      border-color var(--transition-fast),
      background var(--transition-fast),
      transform var(--transition-fast);
    outline: none;
    user-select: none;
  }

  .card:hover {
    border-color: rgba(124, 106, 247, 0.45);
    background: rgba(124, 106, 247, 0.05);
    transform: translateY(-1px);
  }

  .card:focus-visible {
    border-color: var(--accent);
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .card:active {
    transform: translateY(0);
  }

  .card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .card-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    line-height: 1.4;
    transition: color var(--transition-fast);
  }

  .card:hover .card-title {
    color: var(--accent-hover);
  }

  .badges {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: flex-end;
    flex-shrink: 0;
  }

  .badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 6px;
    border-radius: 5px;
  }

  .badge-success {
    background: rgba(166, 227, 161, 0.18);
    color: var(--success);
  }
  .badge-accent {
    background: rgba(124, 106, 247, 0.18);
    color: var(--accent);
  }
  .badge-danger {
    background: rgba(243, 139, 168, 0.18);
    color: var(--danger);
  }
  .badge-muted {
    background: rgba(108, 108, 138, 0.15);
    color: var(--muted);
  }

  .card-desc {
    margin-top: 5px;
    font-size: 11px;
    color: var(--text-dim);
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-meta {
    margin-top: 6px;
    font-size: 10px;
    color: var(--muted);
  }
</style>
