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
  fullScreenContentScrollClass,
  fullScreenContentShellClass,
  fullScreenContentShellEnterTransitionClass,
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

/** Fixed shell: clip width 0 → token (avoids `fr` interpolation overshoot in some browsers). */
const previewDockedOuterClass = `fixed top-[var(--inset-margin-guide)] right-[var(--inset-margin-guide)] bottom-[var(--inset-margin-guide)] z-[47] flex min-h-0 min-w-0 justify-end overflow-hidden ${PREVIEW_DOCK_WIDTH_TRANSITION_CLASS}`;

/** Collapse bar + scrollable main column. */
const previewDockedAsideBaseClass =
  "flex h-full min-h-0 w-preview-panel min-w-0 shrink-0 flex-col overflow-hidden border-hairline border-solid border-border bg-surface-canvas";

/**
 * Full-screen content preview. Open opacity matches `AboutFullScreenView` (mount → fade in).
 * Isolated so the enter transition runs on each full-screen mount.
 */
function ContentPreviewFullScreenView({
  row,
  onShowLess,
  onClose,
}: {
  row: ContentRow;
  onShowLess: () => void;
  onClose: () => void;
}) {
  const [shellEntered, setShellEntered] = useState(false);

  useEffect(() => {
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
  }, []);

  return (
    <div
      data-fae-content-preview
      onPointerDown={(e) => e.stopPropagation()}
      className={`${fullScreenContentShellClass} ${fullScreenContentShellEnterTransitionClass} ${
        shellEntered ? "scale-100 opacity-100" : "scale-95 opacity-0"
      } motion-reduce:scale-100 motion-reduce:opacity-100`}
      role="dialog"
      aria-modal="true"
      aria-label="Content preview full screen"
    >
      <PreviewPanelCollapseBar ariaLabel="Close preview" onClose={onClose} />
      <div className={fullScreenContentScrollClass}>
        <PreviewMainContent row={row} fullScreen />
      </div>
      <div className="flex shrink-0 justify-start">
        <button
          type="button"
          onClick={onShowLess}
          className={fullScreenShowMoreLessButtonClass}
          aria-label="Exit full screen preview"
        >
          <OpenSvgIcon className="shrink-0" />
          <span className={fullScreenShowMoreLessLabelClass}>Show less</span>
        </button>
      </div>
    </div>
  );
}

export const PreviewView = memo(function PreviewView({
  row,
  fullScreen,
  onFullScreenChange,
  className = "",
}: PreviewViewProps) {
  const { closeContentPreview } = useFilterSelection();
  const isMaxLg = useIsMaxLg();
  /** Docked panel: `max-w` 0 → token (replays when leaving full screen). */
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
  }, [fullScreen, isMaxLg]);

  if (isMaxLg) {
    return (
      <MobilePreviewSheet
        row={row}
        zIndex={Z_INDEX.fullscreen}
        onClose={closeContentPreview}
      />
    );
  }

  if (fullScreen) {
    return (
      <ContentPreviewFullScreenView
        key={row.id}
        row={row}
        onShowLess={() => onFullScreenChange(false)}
        onClose={closeContentPreview}
      />
    );
  }

  return (
    <div
      data-fae-content-preview
      onPointerDown={(e) => e.stopPropagation()}
      className={`${previewDockedOuterClass} ${
        shellEntered
          ? "max-w-(--width-preview-panel)"
          : "max-w-0"
      } motion-reduce:max-w-(--width-preview-panel)`}
      role="presentation"
    >
      <aside
        className={`${previewDockedAsideBaseClass} ${className}`}
        aria-label="Content preview"
        role="dialog"
        aria-modal="true"
      >
        <PreviewPanelCollapseBar
          ariaLabel="Close preview"
          onClose={closeContentPreview}
        />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-6">
          <PreviewMainContent row={row} fullScreen={false} />
        </div>
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => onFullScreenChange(true)}
            className={fullScreenShowMoreLessButtonClass}
            aria-label="View full content in full screen"
          >
            <OpenSvgIcon className="shrink-0 rotate-180" />
            <span className={fullScreenShowMoreLessLabelClass}>
              View more
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
});
