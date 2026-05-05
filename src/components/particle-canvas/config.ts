/**
 * How many **particle slots** the idle orbit uses (Strapi `Index` order). Does not limit the API
 * or the filter sidebar: taxonomy picks and search use the full catalog. When a filter spread (or
 * docked preview spread) runs, the first *k* slots temporarily show the matched rows, including
 * items outside this prefix, without creating extra particles.
 *
 * `NEXT_PUBLIC_IMAGE_FETCH_LIMIT`: integer, default 100 when unset/invalid. Use `0` for no cap on
 * swarm size (every row gets a slot).
 */
function readParticleCatalogRowLimit(): number {
  const raw = process.env.NEXT_PUBLIC_IMAGE_FETCH_LIMIT?.trim();
  if (raw === undefined || raw === "") return 100;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return 100;
  return n;
}

/** @see readParticleCatalogRowLimit — env `NEXT_PUBLIC_IMAGE_FETCH_LIMIT` */
export const IMAGE_FETCH_LIMIT = readParticleCatalogRowLimit();

/**
 * Max idle swarm slots on viewports below the `lg` breakpoint (`max-lg`).
 *
 * `NEXT_PUBLIC_IMAGE_FETCH_LIMIT_MOBILE`: integer. Default **20** when unset/invalid.
 * Use **0** to use the same cap as `NEXT_PUBLIC_IMAGE_FETCH_LIMIT` (including uncapped when that is `0`).
 * When both mobile and desktop caps are positive, the effective mobile cap is the minimum of the two.
 */
function readParticleCatalogRowLimitMobile(): number {
  const raw = process.env.NEXT_PUBLIC_IMAGE_FETCH_LIMIT_MOBILE?.trim();
  if (raw === undefined || raw === "") return 20;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return 20;
  return n;
}

/** @see readParticleCatalogRowLimitMobile — env `NEXT_PUBLIC_IMAGE_FETCH_LIMIT_MOBILE` */
export const IMAGE_FETCH_LIMIT_MOBILE = readParticleCatalogRowLimitMobile();

/** Idle orbit text tiles: glyph scramble effect. Off for now — set `true` to re-enable. */
export const IDLE_TEXT_TILE_SCRAMBLE_ENABLED = false;

/**
 * When `true`, skips CSS depth-of-field blur on idle orbit tiles (diagnostic).
 * Set back to `false` once you have confirmed whether blur caused the soft look.
 */
export const IDLE_DEPTH_BLUR_DISABLED = false;
