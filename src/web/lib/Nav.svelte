<script lang="ts">
  import { layoutStore } from "../stores/layout.svelte.js";

  let { onRandomNote }: { onRandomNote?: () => void } = $props();

  let searchOpen = $state(false);

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      searchOpen = !searchOpen;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<nav class="app-nav" role="banner">
  <div class="nav-brand">
    <span aria-hidden="true">🧠</span>
    <span>LogSeq Control Center</span>
  </div>

  <div class="nav-spacer"></div>

  <!-- Search trigger (full search UI is M4) -->
  <button
    class="search-bar"
    onclick={() => (searchOpen = !searchOpen)}
    aria-label="Open search"
  >
    <span>🔍</span>
    <span class="search-placeholder">Search pages…</span>
    <kbd>⌘K</kbd>
  </button>

  <!-- Random note (M4 wires up navigation; for now opens /api/random in new tab) -->
  <button
    class="nav-btn"
    onclick={onRandomNote}
    title="Open a random note (r)"
    aria-label="Random note"
  >
    🎲 Random
  </button>

  <!-- Layout toggle -->
  <button
    class="nav-btn layout-toggle"
    onclick={() => layoutStore.toggle()}
    aria-label="Switch to Layout {layoutStore.value === 'a' ? 'B' : 'A'}"
    title="Toggle dashboard layout"
  >
    ⇄ Layout {layoutStore.value === "a" ? "B" : "A"}
  </button>
</nav>

<style>
  .app-nav {
    background: var(--surface-raised);
    border-bottom: 1px solid var(--border);
    padding: 0 20px;
    height: 48px;
    display: flex;
    align-items: center;
    gap: 10px;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-brand {
    font-size: 14px;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: -0.3px;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }

  .nav-spacer {
    flex: 1;
  }

  .search-bar {
    background: var(--surface-overlay);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 5px 10px;
    color: var(--muted);
    font-family: var(--font);
    font-size: 12px;
    width: 200px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: border-color 0.15s;
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
    transition: border-color 0.15s, color 0.15s;
  }

  .nav-btn:hover {
    color: var(--text);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .layout-toggle {
    border-color: rgba(124, 106, 247, 0.4);
    color: var(--accent);
  }

  .layout-toggle:hover {
    border-color: var(--accent);
    color: var(--accent-hover);
  }
</style>
