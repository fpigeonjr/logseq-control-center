<!-- API fetch helpers shared across components -->
<script lang="ts" module>
  export async function api<T>(path: string): Promise<T> {
    const res = await fetch(`/api${path}`);
    if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
    return res.json() as Promise<T>;
  }
</script>
