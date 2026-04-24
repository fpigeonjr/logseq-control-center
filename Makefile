.PHONY: install dev dev-server dev-web build index lint lint-fix \
        test test-watch test-coverage test-e2e test-e2e-ui test-all \
        typecheck clean playwright-install progress-doc \
        launchd-install launchd-uninstall launchd-logs launchd-status

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

# ── Documentation ──────────────────────────────────────────────────────────

# Open progress tracking for Issue #8 (LaunchAgent)
progress-doc:
	@echo "Opening progress documentation for Issue #8..."
	open issue-8-progress.html 2>/dev/null || \
	  echo "Use: python3 -m http.server 8000 & open http://localhost:8000/issue-8-progress.html"

# ── LaunchAgent (macOS always-on server) ───────────────────────────────────
LAUNCHD_LABEL   := com.fpigeonjr.logseq-control-center
LAUNCHD_PLIST   := launchd/$(LAUNCHD_LABEL).plist
LAUNCHD_DEST    := $(HOME)/Library/LaunchAgents/$(LAUNCHD_LABEL).plist
LOG_DIR         := $(HOME)/.local/share/logs

# Install: copy plist → ~/Library/LaunchAgents and load it
launchd-install: build
	@echo "Creating log directory $(LOG_DIR)…"
	mkdir -p $(LOG_DIR)
	@echo "Installing plist → $(LAUNCHD_DEST)"
	cp $(LAUNCHD_PLIST) $(LAUNCHD_DEST)
	chmod +x launchd/start-server.sh
	@echo "Loading LaunchAgent…"
	launchctl load -w $(LAUNCHD_DEST)
	@echo "Done. Server will start on next login (or now via: launchctl start $(LAUNCHD_LABEL))"

launchd-start:
	@launchctl start $(LAUNCHD_LABEL) && echo "Started $(LAUNCHD_LABEL)"

# Uninstall: unload and remove the plist
launchd-uninstall:
	@echo "Unloading LaunchAgent…"
	launchctl unload -w $(LAUNCHD_DEST) 2>/dev/null || true
	rm -f $(LAUNCHD_DEST)
	@echo "Uninstalled $(LAUNCHD_LABEL)"

# Tail both log files
launchd-logs:
	tail -f $(LOG_DIR)/logseq-control-center.out.log \
	         $(LOG_DIR)/logseq-control-center.err.log 2>/dev/null || \
	  echo "No log files yet — has the LaunchAgent run? (make launchd-install)"

# Show launchd status
launchd-status:
	launchctl print "gui/$$(id -u)/$(LAUNCHD_LABEL)" 2>/dev/null || \
	  launchctl list | grep $(LAUNCHD_LABEL) || echo "$(LAUNCHD_LABEL) not loaded"

# ── Housekeeping ───────────────────────────────────────────────────────────

clean:
	rm -rf dist coverage playwright-report test-results node_modules/.vite
	rm -f issue-8-progress.html
