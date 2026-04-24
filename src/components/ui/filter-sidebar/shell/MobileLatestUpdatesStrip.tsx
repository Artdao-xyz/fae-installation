"use client";

import { useCallback, useId, useLayoutEffect, useMemo, useRef } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { LatestUpdatesTabRail } from "@/components/ui/latest-updates-panel/LatestUpdatesTabRail";
import { selectLatestUpdatesRows } from "@/components/ui/latest-updates-panel/latestUpdatesRows";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { floatingDockPanelOuterHeightPx } from "@/components/ui/floating-panels/right-rail-stack";
import { Thumbnail } from "@/components/ui/thumbnail-full";
import { FLOATING_DOCK_PEEK_CLIP_CLASS } from "./layout-classes";
import { useIsMaxLg } from "./useIsMaxLg";

/**
 * `max-lg` dock row above `MobileFiltersBar`: left tab rail + peek that opens horizontally (same stack
 * state as desktop `LatestUpdatesPanel`). Height matches `floatingDockPanelOuterHeightPx()` — keep
 * `12.875rem` in `mobileMainScrollInsetClassName` in sync (`layout-classes.ts`).
 */
export function MobileLatestUpdatesStrip() {
  const panelId = useId();
  const isMaxLg = useIsMaxLg();
  const { contentCatalog, contentCatalogStatus, openContentPreview } =
    useFilterSelection();
  const { latestUpdatesView, setLatestUpdatesView } = useFloatingPanelStack();

  const rows = useMemo(
    () => selectLatestUpdatesRows(contentCatalog, contentCatalogStatus),
    [contentCatalog, contentCatalogStatus],
  );

  const peekOpen = latestUpdatesView === "peek";
  const dockH = floatingDockPanelOuterHeightPx();

  const toggleDock = useCallback(() => {
    setLatestUpdatesView((v) => (v === "peek" ? "minimized" : "peek"));
  }, [setLatestUpdatesView]);

  /** Each time the strip becomes active (`max-lg` + rows), start minimized — avoids inheriting `peek` from desktop. */
  const stripActive = isMaxLg && rows.length > 0;
  const didInitClosedRef = useRef(false);
  useLayoutEffect(() => {
    if (!stripActive) {
      didInitClosedRef.current = false;
      return;
    }
    if (didInitClosedRef.current) return;
    didInitClosedRef.current = true;
    setLatestUpdatesView("minimized");
  }, [stripActive, setLatestUpdatesView]);

  const peekClipStyle = peekOpen
    ? {
        maxWidth:
          "min(1600px, calc(100vw - var(--width-filter-narrow-column) - env(safe-area-inset-left, 0px)))",
        width: "max-content" as const,
      }
    : { maxWidth: 0 };

  const peekClipClass = peekOpen
    ? "opacity-100"
    : "opacity-0 pointer-events-none";

  if (!isMaxLg || rows.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex min-h-0 shrink-0 flex-row items-stretch overflow-hidden bg-surface-canvas lg:hidden ${
        peekOpen
          ? "w-full self-stretch"
          : "w-fit max-w-full self-start"
      }`}
      style={{
        height: `${dockH}px`,
        minHeight: `${dockH}px`,
      }}
    >
      <LatestUpdatesTabRail
        railLayout="mobileStrip"
        arrowClassName="-scale-x-100"
        onClick={toggleDock}
        ariaExpanded={peekOpen}
        ariaControls={panelId}
      />

      <div
        id={peekOpen ? panelId : undefined}
        role={peekOpen ? "region" : undefined}
        aria-label={peekOpen ? "Latest updates" : undefined}
        className={`flex h-full min-h-0 min-w-0 shrink-0 overflow-hidden ${FLOATING_DOCK_PEEK_CLIP_CLASS} ${peekClipClass} ${
          peekOpen
            ? "border-t-hairline border-solid border-ink-primary"
            : "border-0"
        }`}
        style={peekClipStyle}
      >
        <div className="scrollbar-hide flex h-full w-full min-h-0 min-w-0 flex-col justify-end overflow-x-auto overflow-y-hidden overscroll-contain">
          <div className="flex w-max shrink-0 flex-row flex-nowrap items-end gap-8 px-6 py-3 max-lg:gap-3 max-lg:px-3 max-lg:py-2">
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas"
                onClick={() => openContentPreview(row)}
                aria-label={`Open preview: ${row.shortTitle}`}
              >
                <Thumbnail
                  variant="full"
                  size="lg"
                  fullCardLabelWidth="hugContent"
                  label={row.shortTitle}
                  imageSrc={row.imageUrl}
                  imageAlt={row.title}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
