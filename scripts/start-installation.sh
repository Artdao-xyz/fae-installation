#!/usr/bin/env bash
# Start the FAE exhibition installation locally (production server + browser).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${INSTALLATION_PORT:-3000}"
KIOSK="${INSTALLATION_KIOSK:-0}"
NEXT_CLI="$ROOT/node_modules/next/dist/bin/next"

run_next() {
  if [[ ! -f "$NEXT_CLI" ]]; then
    fail "Next.js is not installed in node_modules. Reinstall dependencies in the app folder."
  fi
  "$NODE_BIN" "$NEXT_CLI" "$@"
}

pause_if_interactive() {
  if [[ -t 0 ]]; then
    read -r -p "Press Enter to close..."
  fi
}

fail() {
  echo ""
  echo "ERROR: $1"
  echo ""
  pause_if_interactive
  exit 1
}

echo "FAE Installation"
echo "================"
echo "Project: $ROOT"
echo ""

# shellcheck source=resolve-bundled-node.sh
source "$(cd "$(dirname "$0")" && pwd)/resolve-bundled-node.sh"

NODE_BIN=""
if bundled="$(resolve_bundled_node_bin "$ROOT" 2>/dev/null || true)" && [[ -n "$bundled" ]]; then
  NODE_BIN="$bundled"
  echo "Using bundled Node ($("$NODE_BIN" -v)) from app/.node/"
elif command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
  echo "Using system Node ($("$NODE_BIN" -v))"
else
  fail "Node.js is not available. Use a release package with app/.node included, or run \"Install Node (optional).command\" — see HOW-TO-RUN.md"
fi

NODE_MAJOR="$("$NODE_BIN" -v | sed 's/^v//' | cut -d. -f1)"
if ! [[ "$NODE_MAJOR" =~ ^[0-9]+$ ]] || (( NODE_MAJOR < 20 )); then
  fail "Node.js v20 or newer is required (found $("$NODE_BIN" -v)). See HOW-TO-RUN.md"
fi

echo ""

if [[ ! -f package.json ]]; then
  fail "package.json not found. Run this script from the installation package."
fi

if [[ ! -f data/catalog.json ]]; then
  echo "Catalog missing at data/catalog.json"
  if [[ -d backups ]] && [[ -f scripts/sync-local-data.mjs ]]; then
    echo "Preparing local data from backups/..."
    npm run prepare:local-data || fail "Could not prepare local data"
  else
    fail "Copy the data/ folder into the installation package, or include backups/."
  fi
fi

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies..."
  npm install || fail "npm install failed"
fi

if [[ ! -f .env.local ]]; then
  echo "Creating .env.local with installation mode enabled"
  printf '%s\n' "NEXT_PUBLIC_FAE_INSTALLATION_MODE=1" "FAE_DATA_SOURCE=local" > .env.local
fi

# Dev machines may leave a compiled config that imports dev-only packages.
if [[ -f next.config.compiled.js ]]; then
  rm -f next.config.compiled.js
fi

# `npm run dev` creates `.next/` too — production start needs `.next/BUILD_ID`.
if [[ ! -f .next/BUILD_ID ]]; then
  if [[ -d .next ]]; then
    echo "No production build found (dev .next/ is not enough for next start)."
  else
    echo "No build found."
  fi
  echo "Building app — first run may take a few minutes..."
  run_next build || fail "Build failed"
fi

if lsof -i ":${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  fail "Port ${PORT} is already in use. Stop the other process or set INSTALLATION_PORT."
fi

echo ""
echo "Starting server on http://localhost:${PORT}"
echo "Admin panel: http://localhost:${PORT}/admin  (default PIN: fae)"
echo ""

run_next start -p "$PORT" &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

READY=0
for _ in $(seq 1 90); do
  if curl -sf "http://localhost:${PORT}" >/dev/null 2>&1; then
    READY=1
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    fail "Server exited before becoming ready. Check errors above."
  fi
  sleep 1
done

if [[ "$READY" -ne 1 ]]; then
  fail "Server did not become ready within 90 seconds."
fi

echo "Server ready."
URL="http://localhost:${PORT}"

if [[ "$(uname -s)" == "Darwin" ]]; then
  if [[ "$KIOSK" == "1" ]] && [[ -d "/Applications/Google Chrome.app" ]]; then
    echo "Opening kiosk browser..."
    open -a "Google Chrome" --args --kiosk --app="${URL}"
  else
    echo "Opening browser..."
    open "${URL}"
  fi
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "${URL}" >/dev/null 2>&1 || true
fi

echo ""
echo "Leave this window open while the installation is running."
echo "Press Ctrl+C to stop."
echo ""

wait "$SERVER_PID"
