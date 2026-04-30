<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../lib/api.js";
  import { formatJournalDate, isoOffset, localIsoToday } from "../lib/format.js";
  import { renderJournalBody } from "../lib/markdown.js";
  import { pageStore } from "../stores/page.svelte.js";
  import type { TodayResponse } from "../../shared/types.js";

  let currentDate = $state<string>(localIsoToday());
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
      const res = await api<{ date: string; page: TodayResponse["page"] }>(`/journal/${iso}`);
      todayData = {
        date: iso,
        page: res.page,
        yesterday: isoOffset(iso, -1),
        tomorrow: isoOffset(iso, 1),
      };

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

  let isToday = $derived(currentDate === localIsoToday());
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
      {#if todayData?.page}
        <div
          class="journal-date clickable"
          data-testid="journal-date"
          role="button"
          tabindex="0"
          onclick={() => pageStore.open(todayData.page.title)}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              pageStore.open(todayData.page.title);
            }
          }}
        >
          {formatJournalDate(currentDate)}
          <span class="journal-iso">{currentDate}</span>
        </div>
      {:else}
        <div class="journal-date" data-testid="journal-date">
          {formatJournalDate(currentDate)}
          <span class="journal-iso">{currentDate}</span>
        </div>
      {/if}

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

  .journal-date.clickable {
    cursor: pointer;
    color: var(--accent);
    transition: color var(--transition-fast);
  }

  .journal-date.clickable:hover {
    color: var(--accent-hover);
    text-decoration: underline;
    text-decoration-color: rgba(124, 106, 247, 0.4);
    text-underline-offset: 3px;
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
