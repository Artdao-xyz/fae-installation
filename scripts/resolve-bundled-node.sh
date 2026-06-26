# Resolve the bundled Node binary for this Mac (sourced by start-installation.sh).
# Layout: $ROOT/.node/arm64/bin/node and $ROOT/.node/x64/bin/node

resolve_bundled_node_bin() {
  local root="$1"
  local arch=""
  arch="$(uname -m 2>/dev/null || true)"

  local node_id=""
  case "$arch" in
    arm64) node_id="arm64" ;;
    x86_64) node_id="x64" ;;
    *)
      return 1
      ;;
  esac

  local candidate="$root/.node/$node_id/bin/node"
  if [[ -x "$candidate" ]]; then
    printf '%s' "$candidate"
    return 0
  fi

  return 1
}
