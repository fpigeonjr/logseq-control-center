<script lang="ts">
  import { layoutStore } from "../stores/layout.svelte.js";

  let { onRandomNote }: { onRandomNote?: () => void } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      // M4: open search modal
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<nav class="app-nav" role="banner">
  <div class="nav-brand" aria-label="LogSeq Control Center">
    <span class="nav-icon" aria-hidden="true">🧠</span>
    <span class="nav-title">LogSeq Control Center</span>
  </div>

  <div class="nav-spacer"></div>

  <!-- Search trigger — full UI in M4 -->
  <button class="search-bar" aria-label="Search pages (⌘K)">
    <span aria-hidden="true">🔍</span>
    <span class="search-placeholder">Search…</span>
    <kbd>⌘K</kbd>
  </button>

  <!-- Random note -->
  <button
    class="nav-btn"
    onclick={onRandomNote}
    title="Random note (r)"
    aria-label="Open a random note"
  >
    <span aria-hidden="true">🎲</span>
    <span class="btn-label">Random</span>
  </button>

  <!-- Layout toggle -->
  <button
    class="nav-btn layout-toggle"
    onclick={() => layoutStore.toggle()}
    aria-label="Switch to Layout {layoutStore.value === 'a' ? 'B' : 'A'}"
  >
    <span aria-hidden="true">⇄</span>
    <span class="btn-label">{layoutStore.value === "a" ? "Today-first" : "Review-first"}</span>
  </button>
</nav>

<style>
  .app-nav {
    background: var(--surface-raised);
    border-bottom: 1px solid var(--border);
    padding: 0 16px;
    height: 48px;
    display: flex;
    align-items: center;
    gap: 8px;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    flex-shrink: 0;
  }

  .nav-icon {
    font-size: 18px;
    line-height: 1;
  }

  .nav-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: -0.02em;
    white-space: nowrap;
  }

  .nav-spacer {
    flex: 1;
    min-width: 0;
  }

  .search-bar {
    background: var(--surface-overlay);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 5px 10px;
    color: var(--muted);
    font-family: var(--font);
    font-size: 12px;
    width: 180px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: border-color var(--transition-fast);
    flex-shrink: 0;
  }

  .search-bar:hover {
    border-color: rgba(124, 106, 247, 0.4);
  }

  .search-placeholder {
    flex: 1;
    text-align: left;
  }

  kbd {
    background: var(--surface-raised);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0 4px;
    font-size: 10px;
    color: var(--muted);
    font-family: var(--font);
    flex-shrink: 0;
  }

  .nav-btn {
    background: var(--surface-overlay);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 5px 10px;
    color: var(--text-dim);
    font-family: var(--font);
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 5px;
    transition:
      border-color var(--transition-fast),
      color var(--transition-fast),
      background var(--transition-fast);
    flex-shrink: 0;
  }

  .nav-btn:hover {
    color: var(--text);
    border-color: rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.04);
  }

  .layout-toggle {
    border-color: rgba(124, 106, 247, 0.35);
    color: var(--accent);
  }

  .layout-toggle:hover {
    border-color: var(--accent);
    color: var(--accent-hover);
    background: rgba(124, 106, 247, 0.08);
  }

  /* ── Responsive ──────────────────────────────────────────── */
  @media (max-width: 640px) {
    .nav-title {
      display: none;
    }

    .search-bar {
      width: 36px;
      padding: 5px 8px;
    }

    .search-placeholder,
    kbd {
      display: none;
    }

    .btn-label {
      display: none;
    }

    .nav-btn {
      padding: 5px 8px;
    }
  }
</style>
