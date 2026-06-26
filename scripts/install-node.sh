#!/usr/bin/env bash
# Optional helper — install or verify Node.js 20+ on macOS before running the kiosk.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=installation-node-version.sh
source "$ROOT/installation-node-version.sh"

MIN_NODE_MAJOR="$INSTALLATION_NODE_MAJOR"

pause_if_interactive() {
  if [[ -t 0 ]]; then
    read -r -p "Press Enter to close..."
  fi
}

node_major() {
  node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1
}

echo "FAE Installation — Node.js setup"
echo "=============================="
echo ""
echo "Required: Node.js ${MIN_NODE_MAJOR}.x (pinned: v${INSTALLATION_NODE_VERSION})"
echo ""

if command -v node >/dev/null 2>&1; then
  major="$(node_major)"
  if [[ "$major" =~ ^[0-9]+$ ]] && (( major >= MIN_NODE_MAJOR )); then
    echo "Node $(node -v) is already installed. You can start the installation."
    echo ""
    pause_if_interactive
    exit 0
  fi
  echo "Found Node $(node -v), but need v${MIN_NODE_MAJOR} or newer."
  echo ""
fi

if command -v brew >/dev/null 2>&1; then
  echo "Homebrew detected. Attempting: brew install node@${MIN_NODE_MAJOR}"
  echo "(You may be asked for your Mac password.)"
  echo ""
  if brew install "node@${MIN_NODE_MAJOR}"; then
    brew link --overwrite --force "node@${MIN_NODE_MAJOR}" 2>/dev/null || true
    if command -v node >/dev/null 2>&1; then
      major="$(node_major)"
      if [[ "$major" =~ ^[0-9]+$ ]] && (( major >= MIN_NODE_MAJOR )); then
        echo ""
        echo "Node $(node -v) installed. You can start the installation."
        pause_if_interactive
        exit 0
      fi
    fi
  fi
  echo ""
  echo "Homebrew install did not complete — use the official installer below."
  echo ""
fi

echo "Opening the Node.js 20.x download page in your browser."
echo ""
echo "  1. Download macOS Installer: node-v${INSTALLATION_NODE_VERSION}.pkg"
echo "     ${INSTALLATION_NODE_MAC_PKG_URL}"
echo "  2. Or use the version archive page (Installer Packages table):"
echo "     ${INSTALLATION_NODE_ARCHIVE_URL}"
echo "  3. Run the .pkg, then check in Terminal: node -v"
echo ""

if command -v open >/dev/null 2>&1; then
  open "$INSTALLATION_NODE_ARCHIVE_URL"
fi

pause_if_interactive
