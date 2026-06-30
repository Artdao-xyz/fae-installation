import type { ContentRow } from "@/data/content-types";
import {
  getThumbnailFullCardOuterSize,
  type ThumbnailSize,
} from "@/components/ui/thumbnail-full";
import {
  type FilterMatchMode,
  type TaxonomyFilterSelection,
  rowMatchesFilterSelection,
} from "@/lib/filter-row-match";
import {
  computeOrganicSpreadLayout,
  relaxViewportCardCenters,
} from "@/lib/organic-spread-layout";
import { clamp, v3, type Vec3 } from "./particle-system";

export type { FilterMatchMode, TaxonomyFilterSelection };

export const FILTER_MAX = 30;
export const REGROUP_MS = 1000;
/** Background dim (opacity + filters) eases faster than spread motion. */
export const FILTER_DIM_MS = 320;
/** Idle hover: full-card scale + background dim share this duration. */
export const HOVER_CARD_MS = 420;
/** Pointer must rest on a tile this long before hover chrome starts (reduces accidental hovers while moving). */
export const HOVER_ENTER_DELAY_MS = 220;
/**
 * Idle hover only counts if the pointer moved (or pressed) recently — otherwise drifting tiles
 * under a stationary cursor fire spurious pointerenter.
 */
export const HOVER_POINTER_MOTION_MAX_AGE_MS = 1000;
/**
 * Min clear space between card **edges** in the spread (organic pack + post-jitter relax).
 * Packer uses image full-card `cw`×`ch` for all tiles, but `variant="text"` often renders
 * wider; extra X (and a bit of Y) keeps titles from colliding.
 */
const SPREAD_GAP_X = 40;
const SPREAD_GAP_Y = 30;
/**
 * After organic pack + polar sort, nudge each slot on xy so large spreads read less like a
 * perfect lattice. Amplitude is **not** capped to ~one margin — `min(cw,ch)*fraction` is the
 * primary scale.
 */
const SPREAD_JITTER_FRACTION_OF_MIN_CARD = 0.18;
const SPREAD_JITTER_MAX_PX = 56;
/**
 * Non-selected tiles while spread is active — multiplied into particle opacity at full dim.
 * Higher = closer to foreground; keep below 1 so matches still read as background.
 */
export const FILTER_BG_OPACITY_MUL = 0.08;
/** Peak grayscale() for spread background tiles at full dim (0–1). */
export const FILTER_BG_GRAYSCALE_MAX = 0.35;
/** How much saturate() is reduced at full dim (1 → 1 - this). */
export const FILTER_BG_DESAT_MUL = 0.3;

/** RAF tick: idle physics vs easing into spread vs locked spread vs easing out. */
export type SpreadLayoutPhase = "idle" | "enter" | "hold" | "leave";

/**
 * Rough max full-card spread slots for a viewport (non-overlap budget; aligns with organic pack).
 * Smaller canvases → fewer tiles; capped at {@link FILTER_MAX}.
 */
export function maxSpreadCountForViewport(
  vw: number,
  vh: number,
  cardSize: ThumbnailSize = "lg",
): number {
  if (!Number.isFinite(vw) || !Number.isFinite(vh) || vw <= 0 || vh <= 0) {
    return 1;
  }
  const { width: cw, height: ch } = getThumbnailFullCardOuterSize(cardSize);
  const pad = 2;
  const innerW = Math.max(0, vw - cw - 2 * pad);
  const innerH = Math.max(0, vh - ch - 2 * pad);
  const unitW = cw + SPREAD_GAP_X;
  const unitH = ch + SPREAD_GAP_Y;
  if (unitW < 1 || unitH < 1) return 1;
  const raw = (innerW / unitW) * (innerH / unitH) * 0.92;
  const n = Math.ceil(raw);
  return clamp(Math.max(1, n), 1, FILTER_MAX);
}

/** How many `contentRows` pass the current taxonomy (same as spread eligibility, before cap). */
export function countContentRowsMatchingFilter(
  contentRows: ContentRow[],
  taxonomy: TaxonomyFilterSelection,
  matchMode: FilterMatchMode = "intersection",
): number {
  let n = 0;
  for (let i = 0; i < contentRows.length; i++) {
    if (rowMatchesFilterSelection(contentRows[i]!, taxonomy, matchMode)) {
      n += 1;
    }
  }
  return n;
}

/** Up to {@link FILTER_MAX} indices: eligible rows by menu tags, then prefer image tiles. */
export function pickSpreadIndicesFromRows(
  contentRows: ContentRow[],
  textIndexSet: Set<number>,
  taxonomy: TaxonomyFilterSelection,
  matchMode: FilterMatchMode = "intersection",
  viewport?: { w: number; h: number } | null,
): number[] {
  const eligible: number[] = [];
  for (let i = 0; i < contentRows.length; i++) {
    if (rowMatchesFilterSelection(contentRows[i]!, taxonomy, matchMode)) {
      eligible.push(i);
    }
  }
  const preferImages: number[] = [];
  const rest: number[] = [];
  for (const i of eligible) {
    if (textIndexSet.has(i)) rest.push(i);
    else preferImages.push(i);
  }
  const ordered = [...preferImages, ...rest];
  let cap = Math.min(FILTER_MAX, ordered.length);
  if (viewport && viewport.w > 0 && viewport.h > 0) {
    cap = Math.min(cap, maxSpreadCountForViewport(viewport.w, viewport.h));
  }
  return ordered.slice(0, cap);
}

/** Image tiles before text tiles, preserving incoming order within each bucket. */
function orderSpreadIndicesImageFirst(
  indices: readonly number[],
  textIndexSet: Set<number>,
  contentRowCount: number,
): number[] {
  const preferImages: number[] = [];
  const rest: number[] = [];
  for (const i of indices) {
    if (i < 0 || i >= contentRowCount) continue;
    if (textIndexSet.has(i)) rest.push(i);
    else preferImages.push(i);
  }
  return [...preferImages, ...rest];
}

/**
 * Preview sources: **all linked indices** (image-first within that group) come before **any**
 * related indices (image-first within related). Then viewport / {@link FILTER_MAX} cap — same
 * as filter spread, without letting related image tiles displace linked text tiles.
 */
export function pickSpreadIndicesLinkedThenRelated(
  contentRows: ContentRow[],
  textIndexSet: Set<number>,
  linkedIndices: readonly number[],
  relatedIndices: readonly number[],
  viewport?: { w: number; h: number } | null,
): number[] {
  const n = contentRows.length;
  const linkedOrdered = orderSpreadIndicesImageFirst(
    linkedIndices,
    textIndexSet,
    n,
  );
  const relatedOrdered = orderSpreadIndicesImageFirst(
    relatedIndices,
    textIndexSet,
    n,
  );
  const full = [...linkedOrdered, ...relatedOrdered];
  let cap = Math.min(FILTER_MAX, full.length);
  if (viewport && viewport.w > 0 && viewport.h > 0) {
    cap = Math.min(cap, maxSpreadCountForViewport(viewport.w, viewport.h));
  }
  return full.slice(0, cap);
}

/**
 * Returns roughly uniform offsets in about [-1,1]×[-1,1] from a deterministic 32-bit mix.
 * `salt` should change when viewport (or other global spread context) changes.
 */
function spreadJitter2dUnit(slot: number, salt: number): { jx: number; jy: number } {
  const h0 = (Math.imul(slot, 0x7feb352d) + salt) | 0;
  const a = (Math.imul(h0 ^ (h0 >>> 16), 0x85ebca6b) >>> 0) / 0x100000000;
  const h1 = (Math.imul(slot * 0x1e3d, 0x5bd1e995) + (salt * 0x2f1b) + 0x9e37) | 0;
  const b = (Math.imul(h1 ^ (h1 >>> 15), 0xc2b2ae35) >>> 0) / 0x100000000;
  return { jx: a * 2 - 1, jy: b * 2 - 1 };
}

function spreadViewportJitterSalt(vw: number, vh: number): number {
  const wi = Math.round(vw) | 0;
  const hi = Math.round(vh) | 0;
  return (Math.imul(wi, 0x1f3a2c) ^ Math.imul(hi, 0x4b19a7d1)) | 0;
}

function biasClusterTowardViewportCenter(
  pts: Vec3[],
  vw: number,
  vh: number,
  cw: number,
  ch: number,
): Vec3[] {
  const n = pts.length;
  if (n === 0) return pts;

  let mx = 0;
  let my = 0;
  for (const p of pts) {
    mx += p.x;
    my += p.y;
  }
  mx /= n;
  my /= n;

  const countFactor = Math.min(n, FILTER_MAX) / FILTER_MAX;
  const alpha = 0.35 + (1 - countFactor) * 0.35;

  const minX = -vw / 2 + cw / 2;
  const maxX = vw / 2 - cw / 2;
  const minY = -vh / 2 + ch / 2;
  const maxY = vh / 2 - ch / 2;

  let tx = -mx * alpha;
  let ty = -my * alpha;

  let txLo = -Infinity;
  let txHi = Infinity;
  let tyLo = -Infinity;
  let tyHi = Infinity;
  for (const p of pts) {
    txLo = Math.max(txLo, minX - p.x);
    txHi = Math.min(txHi, maxX - p.x);
    tyLo = Math.max(tyLo, minY - p.y);
    tyHi = Math.min(tyHi, maxY - p.y);
  }

  tx = clamp(tx, txLo, txHi);
  ty = clamp(ty, tyLo, tyHi);

  return pts.map((p) => v3(p.x + tx, p.y + ty, p.z));
}

export function computeSpreadTargets(
  vw: number,
  vh: number,
  zNear: number,
  count: number,
  /** Card footprint for packing + center bias (e.g. filtered `lg`, background `sm`). */
  cardSize: ThumbnailSize = "lg",
  /**
   * Must change on each filter or preview spread layout so the pack is not identical for the same
   * viewport + count (otherwise a new row can land on the same coordinates as a previous one).
   */
  layoutSalt: number = 0,
): Vec3[] {
  const { width: cw, height: ch } = getThumbnailFullCardOuterSize(cardSize);
  const { positions } = computeOrganicSpreadLayout({
    viewportWidth: vw,
    viewportHeight: vh,
    cardWidth: cw,
    cardHeight: ch,
    gap: Math.min(SPREAD_GAP_X, SPREAD_GAP_Y),
    gapX: SPREAD_GAP_X,
    gapY: SPREAD_GAP_Y,
    count,
    layoutSalt,
  });
  const zFlat = zNear - 0.5;
  const raw = positions.map((pos) => {
    const cx = pos.left + cw / 2;
    const cy = pos.top + ch / 2;
    return v3(cx - vw / 2, cy - vh / 2, zFlat);
  });
  const biased = biasClusterTowardViewportCenter(raw, vw, vh, cw, ch);
  const sorted = biased.sort((a, b) => {
    const da = Math.hypot(a.x, a.y);
    const db = Math.hypot(b.x, b.y);
    if (da !== db) return da - db;
    return Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x);
  });
  const jitterSalt =
    (spreadViewportJitterSalt(vw, vh) ^ (layoutSalt | 0)) | 0;
  const countBoost = 1 + Math.min(0.55, Math.max(0, count - 4) * 0.012);
  const baseAmp = Math.min(cw, ch) * SPREAD_JITTER_FRACTION_OF_MIN_CARD * countBoost;
  const amp = Math.min(SPREAD_JITTER_MAX_PX, Math.max(10, baseAmp));
  const afterJitter = sorted.map((p, j) => {
    const { jx, jy } = spreadJitter2dUnit(j, jitterSalt);
    return v3(p.x + jx * amp, p.y + jy * amp, p.z);
  });
  const work = afterJitter.map((p) => ({ px: p.x + vw / 2, py: p.y + vh / 2 }));
  relaxViewportCardCenters(work, vw, vh, cw, ch, SPREAD_GAP_X, SPREAD_GAP_Y);
  return work.map((c, j) => v3(c.px - vw / 2, c.py - vh / 2, afterJitter[j]!.z));
}

/** Sub-rectangle inside the union placement box (offsets from its top-left). */
export type SpreadPlacementZone = {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
};

function allocateSpreadCountsByArea(
  total: number,
  zones: readonly SpreadPlacementZone[],
): number[] {
  if (total <= 0 || zones.length === 0) return zones.map(() => 0);
  const areas = zones.map((z) => Math.max(0, z.width) * Math.max(0, z.height));
  const sum = areas.reduce((a, b) => a + b, 0);
  if (sum <= 0) return zones.map(() => 0);

  const raw = areas.map((a) => (total * a) / sum);
  const counts = raw.map((x) => Math.floor(x));
  let remainder = total - counts.reduce((a, b) => a + b, 0);
  const order = raw
    .map((x, i) => ({ i, frac: x - counts[i]! }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; remainder > 0; k++) {
    counts[order[k % order.length]!.i]! += 1;
    remainder--;
  }
  return counts;
}

function zoneTargetToUnionSpace(
  target: Vec3,
  zone: SpreadPlacementZone,
  unionWidth: number,
  unionHeight: number,
): Vec3 {
  return v3(
    zone.offsetX + target.x + zone.width / 2 - unionWidth / 2,
    zone.offsetY + target.y + zone.height / 2 - unionHeight / 2,
    target.z,
  );
}

/**
 * Pack filtered tiles into multiple zones (e.g. installation: band above the filter panel + main
 * canvas). Targets are in the union box’s center-relative space — same as {@link computeSpreadTargets}.
 */
export function computeSpreadTargetsInZones(
  unionWidth: number,
  unionHeight: number,
  zones: readonly SpreadPlacementZone[],
  zNear: number,
  count: number,
  cardSize: ThumbnailSize = "lg",
  layoutSalt: number = 0,
): Vec3[] {
  const validZones = zones.filter((z) => z.width > 0 && z.height > 0);
  if (validZones.length === 0) {
    return computeSpreadTargets(
      unionWidth,
      unionHeight,
      zNear,
      count,
      cardSize,
      layoutSalt,
    );
  }
  if (validZones.length === 1) {
    const z = validZones[0]!;
    return computeSpreadTargets(
      z.width,
      z.height,
      zNear,
      count,
      cardSize,
      layoutSalt,
    ).map((t) => zoneTargetToUnionSpace(t, z, unionWidth, unionHeight));
  }

  const perZone = allocateSpreadCountsByArea(count, validZones);
  const out: Vec3[] = [];
  for (let zi = 0; zi < validZones.length; zi++) {
    const zone = validZones[zi]!;
    const n = perZone[zi] ?? 0;
    if (n <= 0) continue;
    const zoneSalt = (layoutSalt ^ Math.imul(zi + 1, 0x9e3779b1)) | 0;
    const packed = computeSpreadTargets(
      zone.width,
      zone.height,
      zNear,
      n,
      cardSize,
      zoneSalt,
    );
    for (const t of packed) {
      out.push(zoneTargetToUnionSpace(t, zone, unionWidth, unionHeight));
    }
  }
  return out;
}
