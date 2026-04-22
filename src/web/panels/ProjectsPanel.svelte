<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../lib/api.js";
  import PageCard from "../lib/PageCard.svelte";
  import type { ProjectsResponse } from "../../shared/types.js";

  let data = $state<ProjectsResponse | null>(null);
  let error = $state<string | null>(null);
  let showCompleted = $state(false);

  onMount(async () => {
    try {
      data = await api<ProjectsResponse>("/projects");
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load projects";
    }
  });

  let totalCount = $derived(data ? data.active.length + data.planning.length : 0);
</script>

<div class="panel" data-testid="projects-panel">
  <div class="panel-header">
    <h2 class="panel-title">🚀 Active Projects</h2>
    {#if data}
      <span class="panel-count" data-testid="projects-count">
        {data.active.length} active{data.planning.length > 0
          ? ` · ${data.planning.length} planning`
          : ""}
      </span>
    {/if}
  </div>

  <div class="panel-body">
    {#if error}
      <p class="state-error">⚠ {error}</p>
    {:else if !data}
      {#each [0, 1, 2] as _}
        <div class="skeleton" style="height:66px;border-radius:10px;margin-bottom:7px;"></div>
      {/each}
    {:else if totalCount === 0}
      <p class="state-empty">No active or planned projects.</p>
    {:else}
      {#if data.active.length > 0}
        <div class="project-list" data-testid="active-list">
          {#each data.active as page (page.title)}
            <PageCard {page} />
          {/each}
        </div>
      {/if}

      {#if data.planning.length > 0}
        <div class="subsection">
          <div class="subsection-label">Planning</div>
          <div class="project-list" data-testid="planning-list">
            {#each data.planning as page (page.title)}
              <PageCard {page} />
            {/each}
          </div>
        </div>
      {/if}

      {#if data.completed.length > 0}
        <div class="collapsed-section">
          <button
            class="collapsed-toggle"
            onclick={() => (showCompleted = !showCompleted)}
            aria-expanded={showCompleted}
          >
            {showCompleted ? "▾" : "▸"}
            {showCompleted ? "Hide" : "Show"}
            {data.completed.length} completed
          </button>
          {#if showCompleted}
            <div class="project-list completed-list" data-testid="completed-list">
              {#each data.completed as page (page.title)}
                <PageCard {page} />
              {/each}
            </div>
          {/if}
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

  .panel-count {
    font-size: 10px;
    color: var(--text-dim);
    background: var(--surface-overlay);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 2px 8px;
  }

  .panel-body {
    padding: 12px;
    overflow-y: auto;
    max-height: 500px;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .project-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .subsection {
    margin-top: 4px;
  }

  .subsection-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin-bottom: 6px;
    padding-left: 2px;
  }

  .collapsed-section {
    border-top: 1px solid var(--border);
    padding-top: 10px;
    margin-top: 2px;
  }

  .collapsed-toggle {
    background: none;
    border: none;
    font-family: var(--font);
    font-size: 11px;
    color: var(--muted);
    cursor: pointer;
    padding: 0;
    transition: color var(--transition-fast);
  }

  .collapsed-toggle:hover {
    color: var(--accent);
  }

  .completed-list {
    margin-top: 8px;
    opacity: 0.65;
  }

  .state-empty {
    color: var(--muted);
    font-size: 12px;
    font-style: italic;
    padding: 4px 0;
  }

  .state-error {
    color: var(--danger);
    font-size: 12px;
  }
</style>
