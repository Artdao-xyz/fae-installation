"use client";

import { useCallback, useId, useMemo } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { FLOATING_DOCK_PEEK_CLIP_CLASS } from "@/components/ui/filter-sidebar/shell/layout-classes";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { LatestUpdatesSvgIcon } from "@/components/ui/icons/LatestUpdatesSvgIcon";
import { navSidebarVerticalLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";
import { floatingDockPanelOuterHeightPx } from "@/components/ui/floating-panels/right-rail-stack";
import { Thumbnail } from "@/components/ui/thumbnail-full";
import type { ContentRow } from "@/data/content-types";

const LATEST_UPDATES_COUNT = 3;

function updatedAtSortKeyMs(row: ContentRow): number {
  const t = row.updatedAt?.trim();
  if (!t) return 0;
  const n = Date.parse(t);
  return Number.isFinite(n) ? n : 0;
}

function LatestUpdatesTabRail({
  arrowClassName,
  onClick,
  ariaExpanded,
  ariaControls,
  className = "",
}: {
  arrowClassName?: string;
  onClick: () => void;
  ariaExpanded: boolean;
  ariaControls: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      onClick={onClick}
      className={`flex min-h-0 w-filter-narrow-column shrink-0 flex-col items-center justify-between self-stretch border-b-hairline border-solid border-ink-primary bg-surface-canvas/90 px-0.5 py-2.5 backdrop-blur-fae-sm transition-colors hover:bg-surface-hover/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${
        ariaExpanded ? "border-r-hairline" : ""
      } ${className}`}
    >
      <OpenSvgIcon
        className={`shrink-0 ${arrowClassName ?? ""} transition-transform duration-500 ease-in-out motion-reduce:transition-none ${
          ariaExpanded ? "rotate-180" : ""
        }`}
      />
      <div className="flex shrink-0 flex-col items-center gap-2">
        <span className={navSidebarVerticalLabelClassName}>Latest Updates</span>
        <LatestUpdatesSvgIcon />
      </div>
    </button>
  );
}

export function LatestUpdatesPanel() {
  const panelId = useId();
  const { contentCatalog, contentCatalogStatus } = useFilterSelection();
  const { latestUpdatesView, setLatestUpdatesView, getChromeZIndex } =
    useFloatingPanelStack();
  const dockOuterH = floatingDockPanelOuterHeightPx();

  const latestThumbnails = useMemo(() => {
    if (contentCatalogStatus !== "success" || contentCatalog.length === 0) {
      return [] as ContentRow[];
    }
    return [...contentCatalog]
      .sort(
        (a, b) => updatedAtSortKeyMs(b) - updatedAtSortKeyMs(a),
      )
      .slice(0, LATEST_UPDATES_COUNT);
  }, [contentCatalog, contentCatalogStatus]);

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
        aria-label={peekOpen ? "Fellowships" : undefined}
        className={`flex h-full min-h-0 min-w-0 shrink-0 overflow-hidden border-solid border-ink-primary ${FLOATING_DOCK_PEEK_CLIP_CLASS} ${peekClipClass} ${
          peekOpen ? "border-b-hairline" : ""
        }`}
        style={peekClipStyle}
      >
        <div className="flex h-full w-full min-h-0 min-w-0 flex-col justify-end overflow-x-auto overflow-y-hidden overscroll-contain">
          <div className="flex w-max shrink-0 flex-row flex-nowrap items-end gap-8 px-6 py-3">
            {latestThumbnails.map((row) => (
              <Thumbnail
                key={row.id}
                variant="full"
                size="lg"
                fullCardLabelWidth="hugContent"
                label={row.shortTitle}
                imageSrc={row.imageUrl}
                imageAlt={row.title}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
