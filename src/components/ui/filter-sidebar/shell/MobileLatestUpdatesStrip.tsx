"use client";

import { useCallback, useId, useLayoutEffect, useMemo, useRef } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { LatestUpdatesTabRail } from "@/components/ui/latest-updates-panel/LatestUpdatesTabRail";
import { selectLatestUpdatesRows } from "@/components/ui/latest-updates-panel/latestUpdatesRows";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { floatingDockPanelOuterHeightPx } from "@/components/ui/floating-panels/right-rail-stack";
import { Thumbnail } from "@/components/ui/thumbnail-full";
import { useIsMaxLg } from "./useIsMaxLg";

/**
 * `max-lg` dock row above `MobileFiltersBar`: right rail that travels to the left while opening
 * a horizontally scrollable latest-updates tray. Height matches `floatingDockPanelOuterHeightPx()` — keep
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

  const peekClipClass = peekOpen
    ? "opacity-100"
    : "opacity-0 pointer-events-none";

  if (!isMaxLg || rows.length === 0) {
    return null;
  }

  return (
    <div
      className="relative min-h-0 w-full shrink-0 self-stretch overflow-hidden bg-transparent lg:hidden"
      style={{
        height: `${dockH}px`,
        minHeight: `${dockH}px`,
      }}
    >
      <div
        className={`absolute inset-y-0 right-0 flex min-h-0 flex-row items-stretch overflow-hidden bg-surface-canvas transition-[width] duration-500 ease-in-out motion-reduce:transition-none ${
          peekOpen ? "w-full" : "w-filter-narrow-column"
        }`}
      >
        <LatestUpdatesTabRail
          railLayout="mobileStrip"
          arrowClassName="-scale-x-100"
          onClick={toggleDock}
          ariaExpanded={peekOpen}
          ariaControls={panelId}
          className="border-l-hairline border-l-solid border-l-ink-primary"
        />
        <div
          id={peekOpen ? panelId : undefined}
          role={peekOpen ? "region" : undefined}
          aria-label={peekOpen ? "Latest updates" : undefined}
          className={`flex h-full min-h-0 min-w-0 flex-1 overflow-hidden border-t-hairline border-solid border-ink-primary transition-opacity duration-300 ease-in-out motion-reduce:transition-none ${peekClipClass}`}
        >
          <div className="scrollbar-hide flex h-full w-full min-h-0 min-w-0 flex-col justify-end overflow-x-auto overflow-y-hidden overscroll-x-contain">
            <div className="flex w-max shrink-0 flex-row flex-nowrap items-end gap-8 px-6 py-3 max-lg:gap-3 max-lg:px-3 max-lg:py-2">
              {rows.map((row, index) => (
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
                    imagePriority={peekOpen && index < 2}
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
    </div>
  );
}
