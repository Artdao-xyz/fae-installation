import type { ContentFixtureRow } from "@/data/content-fixture";
import {
  getThumbnailFullCardOuterSize,
  type ThumbnailSize,
} from "@/components/ui/thumbnail-full";
import { computeOrganicSpreadLayout } from "@/lib/organic-spread-layout";
import { clamp, v3, type Vec3 } from "./particle-system";

export const FILTER_MAX = 10;
export const REGROUP_MS = 1000;
/** Minimum gap between card outer rects (px). */
const SPREAD_GAP = 8;
/** Non-selected tiles while spread is active (nearly invisible background). */
export const FILTER_BG_OPACITY_MUL = 0.03;

/** RAF tick: idle physics vs easing into spread vs locked spread vs easing out. */
export type SpreadLayoutPhase = "idle" | "enter" | "hold" | "leave";

function rowMatchesSpreadTags(
  row: ContentFixtureRow,
  focusSel: ReadonlySet<string>,
  activitySel: ReadonlySet<string>,
): boolean {
  if (focusSel.size === 0 && activitySel.size === 0) return false;
  if (focusSel.size > 0 && !row.focusAreas.some((f) => focusSel.has(f))) {
    return false;
  }
  if (
    activitySel.size > 0 &&
    !row.activityTypes.some((a) => activitySel.has(a))
  ) {
    return false;
  }
  return true;
}

/** Up to {@link FILTER_MAX} indices: eligible rows by menu tags, then prefer image tiles. */
export function pickSpreadIndicesFromRows(
  contentRows: ContentFixtureRow[],
  textIndexSet: Set<number>,
  focusSel: ReadonlySet<string>,
  activitySel: ReadonlySet<string>,
): number[] {
  const eligible: number[] = [];
  for (let i = 0; i < contentRows.length; i++) {
    if (rowMatchesSpreadTags(contentRows[i]!, focusSel, activitySel)) {
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
  const cap = Math.min(FILTER_MAX, ordered.length);
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
    return a.x - b.x;
  });
}
