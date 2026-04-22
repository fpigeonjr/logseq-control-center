<script lang="ts">
  import type { NotePage } from "../../shared/types.js";
  import { yyyymmddToDisplay } from "./format.js";

  let { page, showMeta = true }: { page: NotePage; showMeta?: boolean } = $props();

  const paraColors: Record<string, string> = {
    project: "badge-active",
    area: "badge-planning",
    resource: "bg-muted",
    archive: "badge-muted",
  };

  const statusColors: Record<string, string> = {
    active: "badge-active",
    planning: "badge-planning",
    completed: "badge-muted",
  };
</script>

<div
  class="card"
  role="button"
  tabindex="0"
  aria-label={page.title}
  data-testid="page-card"
>
  <div class="card-top">
    <span class="card-title">{page.title}</span>
    {#if showMeta}
      <div class="badges">
        {#if page.priority === "high"}
          <span class="badge badge-danger">high</span>
        {/if}
        {#if page.status}
          <span class="badge {statusColors[page.status] ?? 'badge-muted'}">{page.status}</span>
        {/if}
        {#if page.para && !page.status}
          <span class="badge {paraColors[page.para] ?? 'badge-muted'}">{page.para}</span>
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
    <p class="card-meta">last reviewed {yyyymmddToDisplay(page.lastReview)}</p>
  {/if}
</div>

<style>
  .card {
    background: var(--surface-overlay);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 10px;
    padding: 10px 12px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    outline: none;
  }

  .card:hover,
  .card:focus-visible {
    border-color: rgba(124, 106, 247, 0.5);
    background: rgba(124, 106, 247, 0.05);
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
    line-height: 1.3;
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
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    padding: 2px 6px;
    border-radius: 6px;
  }

  .badge-active   { background: rgba(166,227,161,0.18); color: var(--success); }
  .badge-planning { background: rgba(124,106,247,0.18); color: var(--accent); }
  .badge-danger   { background: rgba(243,139,168,0.18); color: var(--danger); }
  .badge-muted    { background: rgba(108,108,138,0.18); color: var(--muted); }
  .bg-muted       { background: rgba(108,108,138,0.12); color: var(--muted); }

  .card-desc {
    margin-top: 5px;
    font-size: 11px;
    color: var(--text-dim);
    line-height: 1.4;
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
