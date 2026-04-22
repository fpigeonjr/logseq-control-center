/**
 * Layout store — persists A/B preference to localStorage.
 * Uses Svelte 5 runes in a .svelte.ts module for reactive state.
 */

type Layout = "a" | "b";

function getInitialLayout(): Layout {
  try {
    return (localStorage.getItem("lcc-layout") as Layout) ?? "b";
  } catch {
    return "b"; // fallback for test environments without localStorage
  }
}

let _layout = $state<Layout>(getInitialLayout());

export const layoutStore = {
  get value(): Layout {
    return _layout;
  },
  set(layout: Layout) {
    _layout = layout;
    try {
      localStorage.setItem("lcc-layout", layout);
    } catch {
      // no-op in test environments
    }
  },
  toggle() {
    this.set(_layout === "a" ? "b" : "a");
  },
};
