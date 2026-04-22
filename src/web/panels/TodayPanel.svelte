<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../lib/api.js";
  import { formatJournalDate, isoOffset } from "../lib/format.js";
  import { renderJournalBody } from "../lib/markdown.js";
  import type { TodayResponse } from "../../shared/types.js";

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
      const today = new Date().toISOString().split("T")[0];
      if (iso === today) {
        todayData = await api<TodayResponse>("/today");
      } else {
        const res = await api<{ date: string; page: TodayResponse["page"] }>(`/journal/${iso}`);
        todayData = {
          date: iso,
          page: res.page,
          yesterday: isoOffset(iso, -1),
          tomorrow: isoOffset(iso, 1),
        };
      }

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
      <button onclick={() => navigate(-1)} aria-label="Previous day" title="Previous day"
        >← Prev</button
      >
      <button onclick={() => navigate(1)} disabled={isToday} aria-label="Next day" title="Next day">
        Next →
      </button>
    </div>
  </div>

  <div class="panel-body">
    {#if loadingMeta}
      <div class="skeleton" style="height:20px;width:60%;margin-bottom:14px;"></div>
      {#each [90, 75, 80] as w}
        <div class="skeleton" style="height:12px;width:{w}%;margin-bottom:8px;"></div>
      {/each}
    {:else if error}
      <p class="state-error">⚠ {error}</p>
    {:else}
      <div class="journal-date" data-testid="journal-date">
        {formatJournalDate(currentDate)}
        <span class="journal-iso">{currentDate}</span>
      </div>

      {#if !todayData?.page}
        <p class="state-empty">No journal entry for this day.</p>
      {:else if loadingBody}
        {#each [85, 70, 90] as w}
          <div class="skeleton" style="height:12px;width:{w}%;margin-bottom:8px;"></div>
        {/each}
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
    padding: 11px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .panel-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    flex: 1;
    margin: 0;
  }

  .panel-nav {
    display: flex;
    gap: 4px;
  }

  .panel-nav button {
    background: var(--surface-overlay);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 3px 9px;
    font-family: var(--font);
    font-size: 11px;
    color: var(--text-dim);
    cursor: pointer;
    transition:
      color var(--transition-fast),
      border-color var(--transition-fast);
  }

  .panel-nav button:hover:not(:disabled) {
    color: var(--accent);
    border-color: rgba(124, 106, 247, 0.4);
  }

  .panel-nav button:disabled {
    opacity: 0.25;
    cursor: default;
  }

  .panel-body {
    padding: 16px;
    flex: 1;
    overflow-y: auto;
    max-height: 500px;
  }

  .journal-date {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 14px;
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px;
  }

  .journal-iso {
    font-size: 10px;
    font-weight: 400;
    color: var(--muted);
  }

  /* ── Rendered journal body ──────────────────────────────── */
  .journal-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    line-height: 1.55;
  }

  .journal-body :global(.journal-bullet) {
    display: flex;
    gap: 8px;
    color: var(--text-dim);
    padding: 1px 0;
  }

  .journal-body :global(.journal-bullet::before) {
    content: "•";
    color: var(--accent);
    flex-shrink: 0;
    margin-top: 1px;
    opacity: 0.7;
  }

  .journal-body :global(.journal-heading) {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    margin-top: 10px;
    margin-bottom: 3px;
    padding-bottom: 5px;
    border-bottom: 1px solid var(--border);
  }

  .journal-body :global(.journal-line) {
    color: var(--text-dim);
  }

  .journal-body :global(.wikilink) {
    color: var(--accent);
    cursor: pointer;
    border-bottom: 1px solid rgba(124, 106, 247, 0.3);
    transition: color var(--transition-fast);
  }

  .journal-body :global(.wikilink:hover) {
    color: var(--accent-hover);
    border-bottom-color: var(--accent);
  }

  .journal-body :global(.journal-tag) {
    font-size: 10px;
    color: var(--muted);
    background: var(--surface-overlay);
    border-radius: 4px;
    padding: 1px 5px;
  }

  .journal-body :global(.inline-code) {
    font-family: var(--font);
    font-size: 11px;
    color: var(--text);
    background: var(--surface-overlay);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 4px;
    padding: 1px 6px;
  }

  /* ── Task state bullets ─────────────────────────────────── */
  .journal-body :global(.task-bullet) {
    align-items: baseline;
    gap: 6px;
  }

  .journal-body :global(.task-badge) {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 1px 5px;
    border-radius: 4px;
    flex-shrink: 0;
    text-transform: uppercase;
  }

  /* TODO — amber */
  .journal-body :global(.task-todo .task-badge) {
    background: rgba(250, 179, 135, 0.18);
    color: var(--warning);
    border: 1px solid rgba(250, 179, 135, 0.3);
  }

  /* DOING — accent purple */
  .journal-body :global(.task-doing .task-badge) {
    background: rgba(124, 106, 247, 0.2);
    color: var(--accent-hover);
    border: 1px solid rgba(124, 106, 247, 0.4);
  }

  /* DONE — green + strikethrough */
  .journal-body :global(.task-done .task-badge) {
    background: rgba(166, 227, 161, 0.15);
    color: var(--success);
    border: 1px solid rgba(166, 227, 161, 0.25);
  }

  .journal-body :global(.task-strike) {
    text-decoration: line-through;
    opacity: 0.45;
  }

  /* LATER / WAITING / CANCELLED — muted */
  .journal-body :global(.task-later .task-badge),
  .journal-body :global(.task-waiting .task-badge),
  .journal-body :global(.task-cancelled .task-badge) {
    background: rgba(108, 108, 138, 0.18);
    color: var(--muted);
    border: 1px solid rgba(108, 108, 138, 0.25);
  }

  /* NOW — red / danger */
  .journal-body :global(.task-now .task-badge) {
    background: rgba(243, 139, 168, 0.18);
    color: var(--danger);
    border: 1px solid rgba(243, 139, 168, 0.3);
  }

  .state-empty {
    color: var(--muted);
    font-size: 12px;
    font-style: italic;
  }

  .state-error {
    color: var(--danger);
    font-size: 12px;
  }
</style>
