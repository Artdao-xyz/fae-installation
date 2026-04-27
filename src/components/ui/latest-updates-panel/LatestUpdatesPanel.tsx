"use client";

import { useCallback, useId, useMemo } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { FLOATING_DOCK_PEEK_CLIP_CLASS } from "@/components/ui/filter-sidebar/shell/layout-classes";
import { floatingDockPanelOuterHeightPx } from "@/components/ui/floating-panels/right-rail-stack";
import { Thumbnail } from "@/components/ui/thumbnail-full";
import { LatestUpdatesTabRail } from "./LatestUpdatesTabRail";
import { selectLatestUpdatesRows } from "./latestUpdatesRows";

export function LatestUpdatesPanel() {
  const panelId = useId();
  const { contentCatalog, contentCatalogStatus, openContentPreview } =
    useFilterSelection();
  const { latestUpdatesView, setLatestUpdatesView, getChromeZIndex } =
    useFloatingPanelStack();
  const dockOuterH = floatingDockPanelOuterHeightPx();

  const rows = useMemo(
    () => selectLatestUpdatesRows(contentCatalog, contentCatalogStatus),
    [contentCatalog, contentCatalogStatus],
  );

  const peekOpen = latestUpdatesView === "peek";

  const toggleDock = useCallback(() => {
    setLatestUpdatesView((v) => (v === "peek" ? "minimized" : "peek"));
  }, [setLatestUpdatesView]);

  /**
   * Large viewport cap so long labels + `fullCardLabelWidth="hugContent"` are not
   * boxed by a tiny `min(fixedPx, 100vw)` (which ignored the 100px slack).
   */
  const peekClipStyle = peekOpen
    ? {
        maxWidth:
          "min(1600px, calc(100vw - 2.5rem - var(--width-filter-narrow-column) - env(safe-area-inset-left, 0px)))",
        width: "max-content" as const,
      }
    : { maxWidth: 0 };

  const peekClipClass = peekOpen
    ? "opacity-100"
    : "opacity-0 pointer-events-none";

  if (rows.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-8.5 right-8.5 flex min-h-0 flex-row items-stretch overflow-hidden border-hairline border-b-0 border-solid border-ink-primary bg-surface-canvas/90 shadow-none backdrop-blur-fae-md"
      style={{
        zIndex: getChromeZIndex(
          "latestUpdates",
          peekOpen ? "peek" : "minimized",
        ),
        height: `${dockOuterH}px`,
        minHeight: `${dockOuterH}px`,
      }}
    >
      <LatestUpdatesTabRail
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
            ? "border-b-hairline border-solid border-ink-primary"
            : "border-0"
        }`}
        style={peekClipStyle}
      >
        <div className="scrollbar-hide flex h-full w-full min-h-0 min-w-0 flex-col justify-end overflow-x-auto overflow-y-hidden overscroll-contain">
          <div className="flex w-max shrink-0 flex-row flex-nowrap items-end gap-8 px-6 py-3">
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
                  imageDebugMeta={row.imageDebugMeta}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
