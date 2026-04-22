.PHONY: install dev dev-server dev-web build index lint lint-fix \
        test test-watch test-coverage test-e2e test-e2e-ui test-all \
        typecheck clean playwright-install

# ── Setup ──────────────────────────────────────────────────────────────────

install:
	npm install

playwright-install: install
	npx playwright install --with-deps chromium

# ── Development ────────────────────────────────────────────────────────────

dev: install
	npm run dev

dev-server: install
	npm run dev:server

dev-web: install
	npm run dev:web

# ── Build ──────────────────────────────────────────────────────────────────

build: install
	npm run build

# ── Indexer ────────────────────────────────────────────────────────────────

# Quick stats dump — validates the parser against your real graph
index: install
	npm run index -- --stats

# Full JSON dump (pipe to jq, etc.)
index-json: install
	npm run index

# ── Code quality ───────────────────────────────────────────────────────────

lint: install
	npm run lint

lint-fix: install
	npm run lint:fix

typecheck: install
	npm run typecheck

# ── Tests ──────────────────────────────────────────────────────────────────

test: install
	npm run test

test-watch: install
	npm run test:watch

test-coverage: install
	npm run test:coverage

test-e2e: install playwright-install
	npm run test:e2e

test-e2e-ui: install playwright-install
	npm run test:e2e:ui

# Run everything: typecheck → lint → unit tests → e2e
test-all: install playwright-install
	npm run test:all

# ── Housekeeping ───────────────────────────────────────────────────────────

clean:
	rm -rf dist coverage playwright-report test-results node_modules/.vite
