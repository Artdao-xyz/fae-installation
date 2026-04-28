"use client";

import { useMemo } from "react";
import { createPortal } from "react-dom";

export type PlacementBoundsLike = {
  cx: number;
  cy: number;
  w: number;
  h: number;
};

export type PlacementBoundsDebugStats = {
  /** All content rows in the sim (`contentRows.length`). */
  totalRows: number;
  /** Rows that match the current filter taxonomy (before viewport / FILTER_MAX cap). */
  rowsMatchingFilter: number;
  /**
   * Max tiles the spread packer can place for this `placementBounds` (`maxSpreadCountForViewport`).
   */
  viewportMaxSlots: number;
  /**
   * How many are placed in the active spread (after min(eligible, cap, 20); `null` when idle.
   */
  spreadShown: number | null;
};

/**
 * Opt-in: set `NEXT_PUBLIC_FAE_DEBUG_PLACEMENT=1` in `.env.local` and restart the dev
 * server. Draws the sim’s `placementBounds` in viewport space (fuchsia) so you can
 * compare to the main column, filter rail, and fixed preview. Portaled to `body` with
 * a high z-index so it is not hidden under the `z-30` sim stacking context.
 */
export function useFaePlacementDebugEnabled(): boolean {
  return useMemo(
    () => process.env.NEXT_PUBLIC_FAE_DEBUG_PLACEMENT === "1",
    [],
  );
}

export function PlacementBoundsDebugOverlay({
  bounds,
  stats,
}: {
  bounds: PlacementBoundsLike;
  stats?: PlacementBoundsDebugStats;
}): ReturnType<typeof createPortal> | null {
  const { cx, cy, w, h } = bounds;
  if (typeof document === "undefined") return null;
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) return null;

  const left = cx - w / 2;
  const top = cy - h / 2;

  return createPortal(
    <>
      <div
        className="pointer-events-none fixed box-border border-2 border-fuchsia-500 bg-fuchsia-500/5"
        style={{
          zIndex: 10_000,
          left,
          top,
          width: w,
          height: h,
        }}
        data-fae-placement-bounds-debug
        aria-hidden
      />
      <div
        className="pointer-events-none fixed max-w-[min(320px,calc(100vw-16px))] rounded border border-fuchsia-500/60 bg-zinc-950/90 px-2 py-1 font-mono text-[10px] leading-relaxed text-fuchsia-100 shadow-lg"
        style={{ zIndex: 10_001, left: left + 6, top: top + 6 }}
        data-fae-placement-bounds-debug
        aria-hidden
      >
        <div className="font-semibold text-fuchsia-200">placementBounds</div>
        <div>
          cx: {round(cx)} · cy: {round(cy)}
        </div>
        <div>
          w: {round(w)} · h: {round(h)}
        </div>
        {stats ? (
          <div className="mt-1.5 border-t border-fuchsia-500/30 pt-1.5 text-fuchsia-100">
            <div className="text-[9px] font-semibold text-fuchsia-200">
              sim / spread
            </div>
            <div>Total rows: {stats.totalRows}</div>
            <div>Matching filter: {stats.rowsMatchingFilter}</div>
            <div>Viewport max slots: {stats.viewportMaxSlots}</div>
            <div>
              On screen (spread):{" "}
              {stats.spreadShown === null ? (
                <span className="text-zinc-400">idle</span>
              ) : (
                <span>{stats.spreadShown}</span>
              )}
            </div>
          </div>
        ) : null}
        <div className="mt-0.5 text-zinc-400 text-[9px]">
          .env.local: NEXT_PUBLIC_FAE_DEBUG_PLACEMENT=1 (restart dev)
        </div>
      </div>
    </>,
    document.body,
  );
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
