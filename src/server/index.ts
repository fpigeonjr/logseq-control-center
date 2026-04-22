import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import chokidar from "chokidar";
import path from "path";
import fs from "fs/promises";
import { buildIndex } from "../indexer/index.js";
import { routes } from "./routes.js";
import type { GraphIndex } from "../shared/types.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
async function loadEnv() {
  try {
    const text = await fs.readFile(path.resolve(process.cwd(), ".env"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* no .env */ }
}

await loadEnv();

const NOTES_DIR = (process.env.NOTES_DIR ?? "~/Notes").replace(
  /^~/,
  process.env.HOME!
);
const PORT = Number(process.env.PORT ?? 7890);
const HOST = process.env.HOST ?? "0.0.0.0";

// ---------------------------------------------------------------------------
// Index (rebuilt on file change)
// ---------------------------------------------------------------------------
let index: GraphIndex = await buildIndex(NOTES_DIR);
console.log(
  `[server] Index ready — ${index.pages.length} pages (${new Date(index.builtAt).toLocaleTimeString()})`
);

let rebuildTimer: ReturnType<typeof setTimeout> | null = null;

chokidar
  .watch(path.join(NOTES_DIR, "{pages,journals}"), {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  })
  .on("all", (event, filePath) => {
    if (!filePath.endsWith(".md")) return;
    if (rebuildTimer) clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(async () => {
      console.log(`[server] Rebuilding index (${event}: ${path.basename(filePath)})`);
      index = await buildIndex(NOTES_DIR);
      console.log(`[server] Index rebuilt — ${index.pages.length} pages`);
    }, 600);
  });

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const app = new Hono();

app.use("*", cors({ origin: "*" }));

// Mount API routes (pass the live index via closure)
app.route("/api", routes(() => index));

// Serve the built Svelte app in production
app.use("/*", serveStatic({ root: "./dist/web" }));

serve({ fetch: app.fetch, port: PORT, hostname: HOST }, (info) => {
  console.log(`[server] Listening on http://${info.address}:${info.port}`);
  console.log(`[server] Watching: ${NOTES_DIR}/{pages,journals}`);
});
