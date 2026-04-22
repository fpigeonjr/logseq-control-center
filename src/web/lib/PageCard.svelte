<script lang="ts">
  import type { NotePage } from "../../shared/types.js";

  let { page, showMeta = true }: { page: NotePage; showMeta?: boolean } = $props();

  const paraColors: Record<string, string> = {
    project: "badge-active",
    area: "badge-planning",
    resource: "bg-muted/20 text-muted",
    archive: "bg-white/5 text-gray-500",
  };

  const statusColors: Record<string, string> = {
    active: "badge-active",
    planning: "badge-planning",
    completed: "bg-white/5 text-gray-400",
  };
</script>

<a
  href={`/page/${encodeURIComponent(page.title)}`}
  class="block card hover:border-accent/30 transition-colors group"
>
  <div class="flex items-start justify-between gap-2">
    <span class="font-medium text-gray-100 group-hover:text-accent transition-colors truncate">
      {page.title}
    </span>
    {#if showMeta}
      <div class="flex gap-1.5 shrink-0 flex-wrap justify-end">
        {#if page.para}
          <span class="badge {paraColors[page.para] ?? 'bg-white/5 text-gray-400'}">
            {page.para}
          </span>
        {/if}
        {#if page.status}
          <span class="badge {statusColors[page.status] ?? ''}">
            {page.status}
          </span>
        {/if}
        {#if page.priority === "high"}
          <span class="badge badge-overdue">high</span>
        {/if}
      </div>
    {/if}
  </div>

  {#if page.outcome}
    <p class="mt-1.5 text-sm text-muted line-clamp-1">{page.outcome}</p>
  {:else if page.preview}
    <p class="mt-1.5 text-sm text-muted line-clamp-2">{page.preview}</p>
  {/if}

  {#if page.lastReview}
    <p class="mt-2 text-xs text-gray-600">
      last reviewed {String(page.lastReview).slice(0, 4)}-{String(page.lastReview).slice(4, 6)}-{String(page.lastReview).slice(6, 8)}
    </p>
  {/if}
</a>
