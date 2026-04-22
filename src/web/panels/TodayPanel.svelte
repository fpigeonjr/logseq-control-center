<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../lib/api.js";
  import { formatJournalDate, isoOffset } from "../lib/format.js";
  import { renderJournalBody } from "../lib/markdown.js";
  import type { TodayResponse } from "../../shared/types.js";

  // Current date being viewed (ISO string). Defaults to today.
  let currentDate = $state<string>(new Date().toISOString().split("T")[0]);
  let todayData = $state<TodayResponse | null>(null);
  let bodyHtml = $state<string>("");
  let loadingMeta = $state(true);
  let loadingBody = $state(false);
  let error = $state<string | null>(null);

  async function loadDate(iso: string) {
    loadingMeta = true;
    error = null;
    bodyHtml = "";
    try {
      if (iso === new Date().toISOString().split("T")[0]) {
        todayData = await api<TodayResponse>("/today");
      } else {
        const res = await api<{ date: string; page: typeof todayData extends null ? null : NonNullable<TodayResponse["page"]> }>(`/journal/${iso}`);
        // Normalise to TodayResponse shape for uniform rendering
        todayData = {
          date: iso,
          page: (res as { date: string; page: TodayResponse["page"] }).page,
          yesterday: isoOffset(iso, -1),
          tomorrow: isoOffset(iso, 1),
        };
      }

      // Fetch full body content if the page exists
      if (todayData?.page) {
        loadingBody = true;
        try {
          const content = await api<{ title: string; content: string }>(
            `/content/${encodeURIComponent(todayData.page.title)}`
          );
          bodyHtml = renderJournalBody(content.content);
        } catch {
          bodyHtml = renderJournalBody(todayData.page.preview);
        } finally {
          loadingBody = false;
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load journal";
    } finally {
      loadingMeta = false;
    }
  }

  onMount(() => loadDate(currentDate));

  function navigate(days: number) {
    const next = isoOffset(currentDate, days);
    currentDate = next;
    loadDate(next);
  }

  let isToday = $derived(currentDate === new Date().toISOString().split("T")[0]);
</script>

<div class="panel" data-testid="today-panel">
  <div class="panel-header">
    <h2 class="panel-title">📅 Today</h2>
    <div class="panel-nav">
      <button onclick={() => navigate(-1)} aria-label="Previous day">← Prev</button>
      <button onclick={() => navigate(1)} disabled={isToday} aria-label="Next day"
        >Next →</button
      >
    </div>
  </div>

  <div class="panel-body">
    {#if loadingMeta}
      <div class="skeleton-line wide"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line medium"></div>
    {:else if error}
      <p class="panel-error">⚠ {error}</p>
    {:else}
      <div class="journal-date" data-testid="journal-date">
        {formatJournalDate(currentDate)}
        <span class="journal-iso">{currentDate}</span>
      </div>

      {#if !todayData?.page}
        <p class="empty-state">No journal entry for this day.</p>
      {:else if loadingBody}
        <div class="skeleton-line"></div>
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line wide"></div>
      {:else}
        <div class="journal-body" data-testid="journal-body">
          {@html bodyHtml}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .panel {
    background: var(--surface-raised);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .panel-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .panel-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--muted);
    flex: 1;
    margin: 0;
  }

  .panel-nav {
    display: flex;
    gap: 6px;
  }

  .panel-nav button {
    background: var(--surface-overlay);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 3px 8px;
    font-family: var(--font);
    font-size: 11px;
    color: var(--text-dim);
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }

  .panel-nav button:hover:not(:disabled) {
    color: var(--accent);
    border-color: rgba(124, 106, 247, 0.4);
  }

  .panel-nav button:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .panel-body {
    padding: 16px;
    flex: 1;
    overflow-y: auto;
    max-height: 480px;
  }

  .journal-date {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 14px;
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }

  .journal-iso {
    font-size: 11px;
    font-weight: 400;
    color: var(--muted);
  }

  .journal-body {
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 12px;
    line-height: 1.5;
  }

  /* Styles for rendered journal HTML */
  .journal-body :global(.journal-bullet) {
    display: flex;
    gap: 6px;
    color: var(--text-dim);
    padding: 1px 0;
  }

  .journal-body :global(.journal-bullet)::before {
    content: "•";
    color: var(--accent);
    flex-shrink: 0;
  }

  .journal-body :global(.journal-heading) {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    margin-top: 8px;
    margin-bottom: 2px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--border);
  }

  .journal-body :global(.journal-line) {
    color: var(--text-dim);
  }

  .journal-body :global(.wikilink) {
    color: var(--accent);
    text-decoration: none;
    cursor: pointer;
  }

  .journal-body :global(.wikilink:hover) {
    text-decoration: underline;
  }

  .journal-body :global(.journal-tag) {
    font-size: 10px;
    color: var(--muted);
    background: var(--surface-overlay);
    border-radius: 4px;
    padding: 1px 5px;
  }

  .empty-state {
    color: var(--muted);
    font-size: 12px;
    font-style: italic;
  }

  .panel-error {
    color: var(--danger);
    font-size: 12px;
  }

  /* Skeletons */
  .skeleton-line {
    height: 12px;
    background: var(--surface-overlay);
    border-radius: 4px;
    margin-bottom: 8px;
    width: 60%;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .skeleton-line.wide   { width: 90%; }
  .skeleton-line.medium { width: 75%; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
