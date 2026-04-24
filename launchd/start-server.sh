#!/bin/bash
# LaunchAgent startup wrapper for logseq-control-center.
# Sourced by launchd — shell env is minimal, so we:
#   1. Locate the node binary via fnm
#   2. Source .env for NOTES_DIR / PORT / HOST
#   3. Exec the built server

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Resolve node from fnm ───────────────────────────────────────────────────
# fnm stores node versions under ~/Library/Application Support/fnm/node-versions/.
# We prefer the version pinned in .node-version / .nvmrc if present, otherwise
# we fall back to the default alias.
FNM_DIR="${FNM_DIR:-$HOME/Library/Application Support/fnm}"
NODE_BIN=""

# Check for a pinned version file in the repo
for pin_file in "$REPO_DIR/.node-version" "$REPO_DIR/.nvmrc"; do
  if [[ -f "$pin_file" ]]; then
    PINNED_VERSION="$(tr -d '[:space:]' < "$pin_file")"
    CANDIDATE="$FNM_DIR/node-versions/$PINNED_VERSION/installation/bin/node"
    if [[ -x "$CANDIDATE" ]]; then
      NODE_BIN="$CANDIDATE"
      break
    fi
  fi
done

# Fall back: pick the highest installed version
if [[ -z "$NODE_BIN" ]]; then
  NODE_BIN="$(find "$FNM_DIR/node-versions" -name node -path "*/bin/node" 2>/dev/null \
    | sort -V | tail -1)"
fi

if [[ -z "$NODE_BIN" || ! -x "$NODE_BIN" ]]; then
  echo "ERROR: could not locate node binary under $FNM_DIR" >&2
  exit 1
fi

# ── Source .env ─────────────────────────────────────────────────────────────
ENV_FILE="$REPO_DIR/.env"
if [[ -f "$ENV_FILE" ]]; then
  # Export only KEY=VALUE lines; skip comments and blank lines
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

# Expand tilde in NOTES_DIR (bash won't expand it after sourcing)
NOTES_DIR="${NOTES_DIR/#\~/$HOME}"
export NOTES_DIR

# ── Launch ──────────────────────────────────────────────────────────────────
cd "$REPO_DIR"
exec "$NODE_BIN" dist/server/server/index.js
