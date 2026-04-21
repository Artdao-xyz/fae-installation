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
import { computeOrganicSpreadLayout } from "@/lib/organic-spread-layout";
import { clamp, v3, type Vec3 } from "./particle-system";

export type { FilterMatchMode, TaxonomyFilterSelection };

export const FILTER_MAX = 20;
export const REGROUP_MS = 1000;
/** Background dim (opacity + filters) eases faster than spread motion. */
export const FILTER_DIM_MS = 320;
/** Idle hover: full-card scale + background dim share this duration. */
export const HOVER_CARD_MS = 420;
/** Pointer must rest on a tile this long before hover chrome starts (reduces accidental hovers while moving). */
export const HOVER_ENTER_DELAY_MS = 150;
/** Minimum gap between card outer rects (px). */
const SPREAD_GAP = 26;
/** Non-selected tiles while spread is active (nearly invisible background). */
export const FILTER_BG_OPACITY_MUL = 0.03;

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
  const gap = SPREAD_GAP;
  const pad = 2;
  const innerW = Math.max(0, vw - cw - 2 * pad);
  const innerH = Math.max(0, vh - ch - 2 * pad);
  const unitW = cw + gap;
  const unitH = ch + gap;
  if (unitW < 1 || unitH < 1) return 1;
  const raw = (innerW / unitW) * (innerH / unitH) * 0.92;
  const n = Math.ceil(raw);
  return clamp(Math.max(1, n), 1, FILTER_MAX);
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

/**
 * In-place filter respread: each tile in `sel` is assigned a **distinct** spread
 * anchor from the **previous** spread (`prevSpreadSelection` snapshot positions) by
 * greedy minimum (x,y) distance — so when some cards leave, the rest **re-seat** into
 * the closest free former slots instead of stacking or shrinking toward a centroid.
 *
 * If the spread **grows** (more newcomers than vacated slots), we fall back to a full
 * organic layout for every slot.
 */
export function mergeInPlaceSpreadTargets(
  sel: readonly number[],
  prevSpreadSelection: readonly number[],
  snapshot: ReadonlyArray<{ pos: Vec3 } | undefined>,
  organicTargets: readonly Vec3[],
): Vec3[] {
  const prevSet = new Set(prevSpreadSelection);
  const selSet = new Set(sel);
  let freedCount = 0;
  for (const idx of prevSpreadSelection) {
    if (!selSet.has(idx)) freedCount += 1;
  }

  const newcomers = sel.filter((i) => !prevSet.has(i));
  if (newcomers.length > freedCount) {
    return sel.map(
      (_, j) =>
        organicTargets[j] ?? organicTargets[organicTargets.length - 1]!,
    );
  }

  const pool: Vec3[] = [];
  for (const idx of prevSpreadSelection) {
    const sp = snapshot[idx]?.pos;
    if (sp) pool.push(v3(sp.x, sp.y, sp.z));
  }
  if (pool.length === 0) {
    return sel.map(
      (_, j) =>
        organicTargets[j] ?? organicTargets[organicTargets.length - 1]!,
    );
  }

  const pending = new Set(sel);
  const usedSlot = new Set<number>();
  const targetMap = new Map<number, Vec3>();

  while (pending.size > 0) {
    let bestI = -1;
    let bestK = -1;
    let bestD = Infinity;
    for (const i of pending) {
      const p = snapshot[i]?.pos;
      if (!p) continue;
      for (let k = 0; k < pool.length; k++) {
        if (usedSlot.has(k)) continue;
        const pk = pool[k]!;
        const dx = p.x - pk.x;
        const dy = p.y - pk.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD) {
          bestD = d2;
          bestI = i;
          bestK = k;
        }
      }
    }
    if (bestI < 0 || bestK < 0) break;
    pending.delete(bestI);
    usedSlot.add(bestK);
    const t = pool[bestK]!;
    targetMap.set(bestI, v3(t.x, t.y, t.z));
  }

  return sel.map((i, j) => {
    const t = targetMap.get(i);
    if (t) return t;
    return organicTargets[j] ?? organicTargets[organicTargets.length - 1]!;
  });
}

export function computeSpreadTargets(
  vw: number,
  vh: number,
  zNear: number,
  count: number,
  /** Card footprint for packing + center bias (e.g. filtered `lg`, background `sm`). */
  cardSize: ThumbnailSize = "lg",
): Vec3[] {
  const { width: cw, height: ch } = getThumbnailFullCardOuterSize(cardSize);
  const { positions } = computeOrganicSpreadLayout({
    viewportWidth: vw,
    viewportHeight: vh,
    cardWidth: cw,
    cardHeight: ch,
    gap: SPREAD_GAP,
    count,
  });
  const zFlat = zNear - 0.5;
  const raw = positions.map((pos) => {
    const cx = pos.left + cw / 2;
    const cy = pos.top + ch / 2;
    return v3(cx - vw / 2, cy - vh / 2, zFlat);
  });
  const biased = biasClusterTowardViewportCenter(raw, vw, vh, cw, ch);
  return biased.sort((a, b) => {
    const da = Math.hypot(a.x, a.y);
    const db = Math.hypot(b.x, b.y);
    if (da !== db) return da - db;
    return Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x);
  });
}
