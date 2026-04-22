<script lang="ts">
  import type { StatsResponse } from "../../shared/types.js";

  let { stats }: { stats: StatsResponse } = $props();
</script>

<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
  <div class="card text-center">
    <div class="text-2xl font-bold text-accent">{stats.activeProjects}</div>
    <div class="text-xs text-muted mt-1">Active Projects</div>
  </div>
  <div class="card text-center">
    <div class="text-2xl font-bold {stats.overdueAreas > 0 ? 'text-danger' : 'text-success'}">
      {stats.overdueAreas}
    </div>
    <div class="text-xs text-muted mt-1">Areas Overdue</div>
  </div>
  <div class="card text-center">
    <div class="text-2xl font-bold text-gray-300">{stats.totalPages}</div>
    <div class="text-xs text-muted mt-1">Pages</div>
  </div>
  <div class="card text-center">
    <div class="text-2xl font-bold text-gray-300">{stats.totalJournals}</div>
    <div class="text-xs text-muted mt-1">Journals</div>
  </div>
</div>
