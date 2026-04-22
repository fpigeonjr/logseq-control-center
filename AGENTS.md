# Agent Guidelines — LogSeq Control Center

## Project Purpose
Local web dashboard over a LogSeq graph (`~/Notes`).
Server: Hono + Node/TS. UI: Svelte 5 + Tailwind. Tests: Vitest (unit) + Playwright (e2e).

## Build / Lint / Test Commands
- **Install:** `make install`
- **Dev:** `make dev` (server :7890, Vite :5173)
- **Validate parser against real graph:** `make index`
- **Lint:** `make lint` / `make lint-fix`
- **Typecheck:** `make typecheck`
- **Unit tests:** `make test` / `make test-watch`
- **Coverage:** `make test-coverage`
- **E2E:** `make test-e2e` / `make test-e2e-ui`
- **All checks:** `make test-all`

## Code Style
- TypeScript strict mode throughout
- ESLint flat config (eslint.config.js) + Prettier (.prettierrc)
- 2-space indent, 100-column width, double quotes, trailing commas (ES5)
- `prettier-plugin-svelte` handles .svelte files

## Architecture Rules
- `src/shared/types.ts` — all shared types; no duplication between server and web
- `src/indexer/` — pure file I/O + parsing; no Hono, no Svelte
- `src/server/` — Hono routes only; import from indexer and shared
- `src/web/` — Svelte components only; all data via `/api/*` fetch calls
- **Read-only v1:** no writes to `~/Notes` in any server route

## Parser Contract (critical)
- LogSeq uses `key:: value` block syntax at the top of files
- Properties end at the first non-property, non-blank line (bullet `- ` or heading `#`)
- Keys are lowercased; values are trimmed strings
- **No YAML `---` frontmatter support** — LogSeq format only

## Testing Conventions
- Unit tests co-located in `src/**/__tests__/*.test.ts`
- Fixture notes live in `tests/fixtures/notes/{pages,journals}/`
- E2E tests in `tests/e2e/*.spec.ts` — hit the live server at `:7890`
- Add a unit test for every new parser edge case or route
- Keep fixture files minimal and clearly named

## Environment
- `NOTES_DIR` (default `~/Notes`) — path to the LogSeq graph
- `PORT` (default `7890`) — Hono server port
- `HOST` (default `0.0.0.0`) — bind address
- Copy `.env.example` → `.env` for local overrides; never commit `.env`
