# LogSeq Control Center

Local dashboard for your LogSeq graph — a life OS control center.

> **Status:** M2 complete, M3 in progress  
> **Project Board:** [LogSeq Control Center - Kanban](https://github.com/users/fpigeonjr/projects/1)

## Progress Tracking

Track development progress via the [GitHub Project Board](https://github.com/users/fpigeonjr/projects/1):

- **M1:** Complete — Indexer, API server, tests
- **M2:** Complete — Today/Areas/Projects dashboard UI
- **M3:** In progress — Polish + deploy (LaunchAgent, mobile access)
- **M4:** Planned — Search + random note features
- **M5:** Planned — Write features (quick capture, review queue)

## Prerequisites

- Node 20+
- `~/Notes` containing a LogSeq graph (pages/ and journals/ subdirectories)

## Quick start

```bash
cp .env.example .env    # edit NOTES_DIR if your graph is elsewhere
make install
make index              # validate the parser against your real graph
make dev                # server on :7890 + Vite dev server on :5173
```

Then open `http://localhost:5173` in your browser.

## Available commands

| Command              | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `make dev`           | Start both server and Vite dev server with hot reload |
| `make index`         | Run the indexer and print stats (validates parser)    |
| `make index-json`    | Full JSON dump of the graph index                     |
| `make test`          | Run Vitest unit tests                                 |
| `make test-watch`    | Run Vitest in watch mode                              |
| `make test-coverage` | Run tests + generate coverage report                  |
| `make test-e2e`      | Run Playwright e2e tests (requires server)            |
| `make test-e2e-ui`   | Open Playwright UI                                    |
| `make test-all`      | typecheck + lint + unit + e2e                         |
| `make lint`          | ESLint + Prettier check                               |
| `make lint-fix`      | Auto-fix lint and formatting issues                   |
| `make typecheck`     | TypeScript type check                                 |
| `make build`         | Production build                                      |
| `make clean`         | Remove build artifacts                                |

## Project structure

```
src/
  shared/       # Types shared between server and web UI
  indexer/      # LogSeq file parser + graph index builder
    __tests__/  # Unit tests for parser and indexer
  server/       # Hono API server
    __tests__/  # Unit tests for all routes
  web/          # Svelte + Tailwind UI
    lib/        # Reusable Svelte components
tests/
  e2e/          # Playwright integration tests
  fixtures/     # Sample LogSeq notes used by unit tests
```

## Always-on server (macOS LaunchAgent)

Run the dashboard automatically on login so it's always available on your LAN:

```bash
# 1. Build the production server
make build

# 2. Copy .env.example → .env and set your NOTES_DIR / PORT
cp .env.example .env

# 3. Install & start the LaunchAgent
make launchd-install

# 4. (Optional) start immediately without waiting for re-login
launchctl start com.fpigeonjr.logseq-control-center
```

### LAN access

Once running, open the dashboard from any device on your local network:

```
http://<your-mac-hostname>.local:7890
```

Find your hostname with `scutil --get LocalHostName`. The server binds to
`0.0.0.0` by default (`HOST=0.0.0.0` in `.env`) so it's reachable over Wi-Fi.

### LaunchAgent commands

| Command | Description |
| ---------------------- | ----------------------------------------- |
| `make launchd-install` | Build, install plist, and load the agent |
| `make launchd-uninstall` | Unload and remove the plist |
| `make launchd-logs` | Tail stdout + stderr log files |
| `make launchd-status` | Show launchd service status |

Logs are written to `~/.local/share/logs/logseq-control-center.{out,err}.log`.

## API routes

| Route                    | Description                       |
| ------------------------ | --------------------------------- |
| `GET /api/health`        | Server health + page count        |
| `GET /api/today`         | Today's journal + date nav        |
| `GET /api/journal/:date` | Journal for a specific YYYY-MM-DD |
| `GET /api/projects`      | Projects grouped by status        |
| `GET /api/areas`         | Areas grouped by review urgency   |
| `GET /api/resources`     | All resource pages                |
| `GET /api/random`        | Random non-archive page           |
| `GET /api/page/:title`   | Single page + backlinks           |
| `GET /api/search?q=`     | Full-text substring search        |
| `GET /api/stats`         | PARA counts + overdue summary     |

## Environment variables

See `.env.example` for all options.

## Tech stack

- **Server:** Node + TypeScript + [Hono](https://hono.dev/)
- **UI:** Svelte 5 + Vite + Tailwind CSS
- **Parser:** Custom LogSeq `property:: value` block parser
- **File watch:** chokidar (index auto-rebuilds on file change)
- **Unit tests:** Vitest
- **E2E tests:** Playwright
- **Lint:** ESLint (flat config) + Prettier
