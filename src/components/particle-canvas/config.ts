// Set NEXT_PUBLIC_IMAGE_FETCH_LIMIT to an integer to limit rows/images. Use 0 to fetch all rows.
// Defaults to 100 when unset or invalid.
function readImageFetchLimit(): number {
  const raw = process.env.NEXT_PUBLIC_IMAGE_FETCH_LIMIT?.trim();
  if (raw === undefined || raw === "") return 100;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return 100;
  return n;
}

export const IMAGE_FETCH_LIMIT = readImageFetchLimit();

/** Idle orbit text tiles: glyph scramble effect. Off for now — set `true` to re-enable. */
export const IDLE_TEXT_TILE_SCRAMBLE_ENABLED = false;

/**
 * When `true`, skips CSS depth-of-field blur on idle orbit tiles (diagnostic).
 * Set back to `false` once you have confirmed whether blur caused the soft look.
 */
export const IDLE_DEPTH_BLUR_DISABLED = false;
