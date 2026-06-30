"use client";

import {
  memo,
  useEffect,
  useState,
} from "react";
import type { ContentRow } from "@/data/content-types";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { PREVIEW_DOCK_WIDTH_TRANSITION_CLASS } from "@/components/ui/filter-sidebar/shell/layout-classes";
import { useIsMaxLg } from "@/components/ui/filter-sidebar/shell/useIsMaxLg";
import { Z_INDEX } from "@/lib/z-index-scale";
import { MobilePreviewSheet } from "./MobilePreviewSheet";
import { PreviewMainContent } from "./PreviewMainContent";
import {
  fullScreenContentInnerClass,
  fullScreenContentScrollClass,
  fullScreenShowMoreLessButtonClass,
  fullScreenShowMoreLessLabelClass,
} from "./fullScreenContentChrome";
import { PreviewPanelCollapseBar } from "./PreviewPanelCollapseBar";

type PreviewViewProps = {
  row: ContentRow;
  /** When true, preview fills the viewport (docked panel hidden). */
  fullScreen: boolean;
  onFullScreenChange: (fullScreen: boolean) => void;
  className?: string;
};

/** Right-anchored clip shell — docked and full-screen share the same width fold. */
const previewShellOuterClass = `fixed top-[var(--inset-margin-guide)] right-[var(--inset-margin-guide)] bottom-[var(--inset-margin-guide)] flex min-h-0 min-w-0 justify-end overflow-hidden ${PREVIEW_DOCK_WIDTH_TRANSITION_CLASS}`;

const previewDockedMaxWClass = "max-w-(--width-preview-panel)";
const previewFullMaxWClass =
  "max-w-[calc(100vw-2*var(--inset-margin-guide))]";

const previewDockedAsideClass =
  "flex h-full min-h-0 w-preview-panel min-w-0 shrink-0 flex-col overflow-hidden border-hairline border-solid border-border bg-surface-canvas";

const previewFullAsideClass =
  "flex h-full min-h-0 w-[calc(100vw-2*var(--inset-margin-guide))] min-w-0 shrink-0 flex-col overflow-hidden border-hairline border-solid border-border bg-surface-canvas";

export const PreviewView = memo(function PreviewView({
  row,
  fullScreen,
  onFullScreenChange,
  className = "",
}: PreviewViewProps) {
  const { closeContentPreview } = useFilterSelection();
  const isMaxLg = useIsMaxLg();
  /** Docked open: `max-w` 0 → panel width (runs once on mount). */
  const [shellEntered, setShellEntered] = useState(false);

  useEffect(() => {
    if (!fullScreen || isMaxLg) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [fullScreen, isMaxLg]);

  useEffect(() => {
    if (isMaxLg) return;
    let cancelled = false;
    let raf = 0;
    queueMicrotask(() => {
      if (cancelled || typeof window === "undefined") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setShellEntered(true);
        return;
      }
      setShellEntered(false);
      raf = requestAnimationFrame(() => {
        if (!cancelled) setShellEntered(true);
      });
    });
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isMaxLg]);

  if (isMaxLg) {
    return (
      <MobilePreviewSheet
        row={row}
        zIndex={Z_INDEX.fullscreen}
        onClose={closeContentPreview}
      />
    );
  }

  const shellMaxWClass = !shellEntered
    ? "max-w-0"
    : fullScreen
      ? previewFullMaxWClass
      : previewDockedMaxWClass;

  const motionReduceMaxWClass = fullScreen
    ? "motion-reduce:max-w-[calc(100vw-2*var(--inset-margin-guide))]"
    : "motion-reduce:max-w-(--width-preview-panel)";

  return (
    <div
      data-fae-content-preview
      onPointerDown={(e) => e.stopPropagation()}
      className={`${previewShellOuterClass} ${shellMaxWClass} ${motionReduceMaxWClass} ${
        fullScreen ? "z-50" : "z-47"
      }`}
      role="presentation"
    >
      <aside
        className={`${
          fullScreen ? previewFullAsideClass : previewDockedAsideClass
        } ${className}`}
        aria-label="Content preview"
        role="dialog"
        aria-modal="true"
      >
        <PreviewPanelCollapseBar
          ariaLabel="Close preview"
          onClose={closeContentPreview}
        />
        {fullScreen ? (
          <div className={fullScreenContentScrollClass}>
            <div className={fullScreenContentInnerClass}>
              <PreviewMainContent row={row} fullScreen />
            </div>
          </div>
        ) : (
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-6">
            <PreviewMainContent row={row} fullScreen={false} />
          </div>
        )}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => onFullScreenChange(!fullScreen)}
            className={fullScreenShowMoreLessButtonClass}
            aria-label={
              fullScreen
                ? "Exit full screen preview"
                : "View full content in full screen"
            }
          >
            <OpenSvgIcon
              className={`shrink-0 ${fullScreen ? "" : "rotate-180"}`}
            />
            <span className={fullScreenShowMoreLessLabelClass}>
              {fullScreen ? "Show less" : "View more"}
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
});
