/**
 * Page navigation store — manages switching between dashboard and detail views.
 * Syncs with URL hash so detail pages are linkable and survive refresh.
 */

export type PageView = { type: "dashboard" } | { type: "detail"; title: string };

function getInitialView(): PageView {
  if (typeof window === "undefined") return { type: "dashboard" };
  const hash = window.location.hash;
  const match = hash.match(/^#\/page\/(.+)$/);
  if (match) {
    return { type: "detail", title: decodeURIComponent(match[1]) };
  }
  return { type: "dashboard" };
}

let _view = $state<PageView>(getInitialView());

function syncHash(view: PageView) {
  if (typeof window === "undefined") return;
  if (view.type === "detail") {
    window.location.hash = `#/page/${encodeURIComponent(view.title)}`;
  } else {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

export const pageStore = {
  get view(): PageView {
    return _view;
  },
  get isDashboard(): boolean {
    return _view.type === "dashboard";
  },
  get detailTitle(): string | null {
    return _view.type === "detail" ? _view.title : null;
  },
  open(title: string) {
    _view = { type: "detail", title };
    syncHash(_view);
  },
  close() {
    _view = { type: "dashboard" };
    syncHash(_view);
  },
  handleHashChange() {
    _view = getInitialView();
  },
};
