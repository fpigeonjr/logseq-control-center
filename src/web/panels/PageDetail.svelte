<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../lib/api.js";
  import { renderJournalBody } from "../lib/markdown.js";
  import { yyyymmddToDisplay } from "../lib/format.js";
  import { pageStore } from "../stores/page.svelte.js";
  import PageCard from "../lib/PageCard.svelte";
  import type { PageDetailResponse, NotePage } from "../../shared/types.js";

  let { title }: { title: string } = $props();

  let data = $state<PageDetailResponse | null>(null);
  let bodyHtml = $state<string>("");
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function load() {
    loading = true;
    error = null;
    bodyHtml = "";

    try {
      const [detailRes, contentRes] = await Promise.allSettled([
        api<PageDetailResponse>(`/page/${encodeURIComponent(title)}`),
        api<{ title: string; content: string }>(`/content/${encodeURIComponent(title)}`),
      ]);

      if (detailRes.status === "rejected") {
        throw new Error("Failed to load page");
      }
      data = detailRes.value;

      if (contentRes.status === "fulfilled") {
        bodyHtml = renderJournalBody(contentRes.value.content);
      } else {
        bodyHtml = renderJournalBody(data.page.preview);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load page";
    } finally {
      loading = false;
    }
  }

  onMount(() => load());

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      pageStore.close();
    }
  }

  function formatCreated(n?: number): string {
    if (!n) return "";
    return yyyymmddToDisplay(n);
  }

  const statusBadge: Record<string, string> = {
    active: "badge-accent",
    planning: "badge-warning",
    completed: "badge-muted",
  };
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="detail-page lcc-fade-in" data-testid="page-detail">
  <!-- Header -->
  <div class="detail-header">
    <button
      class="back-btn"
      onclick={() => pageStore.close()}
      aria-label="Back to dashboard"
      title="Back (Esc)"
    >
      ← Back
    </button>
  </div>

  {#if loading}
    <div class="detail-skeleton">
      <div class="skeleton" style="height:28px;width:50%;margin-bottom:16px;"></div>
      <div class="skeleton" style="height:14px;width:30%;margin-bottom:24px;"></div>
      {#each [95, 90, 88, 92, 85] as w}
        <div class="skeleton" style="height:12px;width:{w}%;margin-bottom:8px;"></div>
      {/each}
    </div>
  {:else if error}
    <p class="state-error">⚠ {error}</p>
  {:else if data}
    {@const page = data.page}

    <!-- Title -->
    <h1 class="detail-title">{page.title}</h1>

    <!-- Metadata badges -->
    <div class="detail-badges">
      {#if page.para}
        <span class="badge badge-para">{page.para}</span>
      {/if}
      {#if page.status}
        <span class="badge {statusBadge[page.status] ?? 'badge-muted'}">{page.status}</span>
      {/if}
      {#if page.priority}
        <span class="badge badge-priority">{page.priority}</span>
      {/if}
      {#if page.frequency}
        <span class="badge badge-muted">{page.frequency}</span>
      {/if}
      {#if page.created}
        <span class="badge badge-muted">created {formatCreated(page.created)}</span>
      {/if}
      {#if page.lastReview}
        <span class="badge badge-muted">reviewed {formatCreated(page.lastReview)}</span>
      {/if}
    </div>

    <!-- Outcome / Responsibility -->
    {#if page.outcome}
      <div class="detail-section">
        <div class="section-label">Outcome</div>
        <p class="detail-outcome">{page.outcome}</p>
      </div>
    {/if}

    {#if page.responsibility}
      <div class="detail-section">
        <div class="section-label">Responsibility</div>
        <p class="detail-responsibility">{page.responsibility}</p>
      </div>
    {/if}

    <!-- Body -->
    {#if bodyHtml}
      <div class="detail-section">
        <div class="section-label">Content</div>
        <div class="journal-body detail-body">
          {@html bodyHtml}
        </div>
      </div>
    {/if}

    <!-- Backlinks -->
    {#if data.backlinks.length > 0}
      <div class="detail-section">
        <div class="section-label">
          Linked from · {data.backlinks.length}
        </div>
        <div class="backlink-list">
          {#each data.backlinks as backlink (backlink.title)}
            <PageCard page={backlink} showMeta={false} />
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .detail-page {
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .detail-header {
    display: flex;
    align-items: center;
  }

  .back-btn {
    background: var(--surface-overlay);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 5px 12px;
    font-family: var(--font);
    font-size: 12px;
    color: var(--text-dim);
    cursor: pointer;
    transition:
      color var(--transition-fast),
      border-color var(--transition-fast),
      background var(--transition-fast);
  }

  .back-btn:hover {
    color: var(--accent);
    border-color: rgba(124, 106, 247, 0.4);
    background: rgba(124, 106, 247, 0.08);
  }

  .detail-skeleton {
    padding-top: 8px;
  }

  .detail-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin: 0;
  }

  .detail-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 3px 8px;
    border-radius: 5px;
  }

  .badge-para {
    background: rgba(124, 106, 247, 0.12);
    color: var(--accent);
    border: 1px solid rgba(124, 106, 247, 0.25);
  }

  .badge-accent {
    background: rgba(124, 106, 247, 0.18);
    color: var(--accent);
  }
  .badge-warning {
    background: rgba(250, 179, 135, 0.18);
    color: var(--warning);
  }
  .badge-muted {
    background: rgba(108, 108, 138, 0.15);
    color: var(--muted);
  }
  .badge-priority {
    background: rgba(243, 139, 168, 0.18);
    color: var(--danger);
  }

  .detail-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
  }

  .detail-outcome,
  .detail-responsibility {
    font-size: 13px;
    color: var(--text-dim);
    line-height: 1.5;
    margin: 0;
  }

  .detail-body {
    background: var(--surface-raised);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 16px;
  }

  .backlink-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 8px;
  }

  .state-error {
    color: var(--danger);
    font-size: 13px;
  }

  @media (max-width: 480px) {
    .detail-page {
      padding: 12px;
      gap: 12px;
    }

    .detail-title {
      font-size: 18px;
    }

    .backlink-list {
      grid-template-columns: 1fr;
    }
  }
</style>
