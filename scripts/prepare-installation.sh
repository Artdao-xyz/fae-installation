#!/usr/bin/env bash
# One-time Mac prep after download (Google Drive, email, etc.).
# Clears quarantine flags and restores execute permissions.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "FAE Installation — first-time Mac setup"
echo "======================================="
echo "Folder: $ROOT"
echo ""

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script is for macOS only. On other systems, unzip and run Start."
  exit 0
fi

echo "Removing download quarantine (may take a minute)..."
xattr -cr "$ROOT" 2>/dev/null || true

echo "Restoring execute permissions..."
chmod +x \
  "Start FAE Installation.command" \
  "Install Node (optional).command" \
  "Prepare FAE Installation.command" \
  2>/dev/null || true

if [[ -d app/scripts ]]; then
  chmod +x app/scripts/*.sh 2>/dev/null || true
fi

if [[ -d app/.node ]]; then
  find app/.node -type f -name node -exec chmod +x {} + 2>/dev/null || true
fi

echo ""
echo "Ready. Double-click: Start FAE Installation.command"
echo ""

if [[ -t 0 ]]; then
  read -r -p "Press Enter to close..."
fi
