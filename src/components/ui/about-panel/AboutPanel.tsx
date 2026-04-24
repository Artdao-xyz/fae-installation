"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { FLOATING_DOCK_PEEK_CLIP_CLASS } from "@/components/ui/filter-sidebar/shell/layout-classes";
import { useIsMaxLg } from "@/components/ui/filter-sidebar/shell/useIsMaxLg";
import { AboutSvgIcon } from "@/components/ui/icons/AboutSvgIcon";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { navSidebarVerticalLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";
import { floatingDockPanelOuterHeightPx } from "@/components/ui/floating-panels/right-rail-stack";
import {
  fullScreenContentInnerClass,
  fullScreenContentScrollClass,
  fullScreenContentShellClass,
  fullScreenContentShellEnterTransitionClass,
  fullScreenShowMoreLessButtonClass,
  fullScreenShowMoreLessLabelClass,
} from "@/components/ui/preview/fullScreenContentChrome";
import { PreviewPanelCollapseBar } from "@/components/ui/preview/PreviewPanelCollapseBar";
import { Z_INDEX } from "@/lib/z-index-scale";
import { AboutPanelRichContent, ABOUT_BODY } from "./AboutShared";
import { MobileAboutSheet } from "./MobileAboutSheet";

/**
 * Isolated so open animation runs on each mount, matching the preview full-screen enter transition.
 */
function AboutFullScreenView({
  zIndex,
  onBackToPeek,
}: {
  zIndex: number;
  onBackToPeek: () => void;
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
      className={`${fullScreenContentShellClass} ${fullScreenContentShellEnterTransitionClass} ${
        shellEntered ? "scale-100 opacity-100" : "scale-95 opacity-0"
      } motion-reduce:scale-100 motion-reduce:opacity-100`}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-label="About Future Art Ecosystems"
    >
      <PreviewPanelCollapseBar
        ariaLabel="Back to About panel"
        onClose={onBackToPeek}
      />
      <div className={fullScreenContentScrollClass}>
        <div className={fullScreenContentInnerClass}>
          <AboutPanelRichContent />
        </div>
      </div>
      <div className="flex shrink-0 justify-start">
        <button
          type="button"
          onClick={onBackToPeek}
          className={fullScreenShowMoreLessButtonClass}
          aria-label="Back to About panel"
        >
          <OpenSvgIcon className="shrink-0" />
          <span className={fullScreenShowMoreLessLabelClass}>Show less</span>
        </button>
      </div>
    </div>
  );
}

function AboutTabRail({
  arrowClassName,
  onClick,
  ariaExpanded,
  ariaControls,
}: {
  arrowClassName?: string;
  onClick: () => void;
  ariaExpanded: boolean;
  ariaControls: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      onClick={onClick}
      className={`flex h-full min-h-0 w-filter-narrow-column shrink-0 flex-col items-center self-stretch border-b-0 border-solid border-ink-primary bg-surface-canvas/90 py-2.5 backdrop-blur-fae-sm transition-colors hover:bg-surface-hover/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${
        ariaExpanded ? "border-r-hairline" : ""
      }`}
    >
      <div className="flex min-h-[72px] w-full flex-1 flex-col items-center justify-between px-0.5">
        <OpenSvgIcon
          className={`${arrowClassName ?? ""} transition-transform duration-500 ease-in-out motion-reduce:transition-none ${
            ariaExpanded ? "rotate-180" : ""
          }`}
        />
        <span className={navSidebarVerticalLabelClassName}>About</span>
      </div>
      <AboutSvgIcon className="mt-2" />
    </button>
  );
}

export function AboutPanel() {
  const panelId = useId();
  const isMaxLg = useIsMaxLg();
  const dockOuterH = floatingDockPanelOuterHeightPx();
  const { aboutView, setAboutView, getChromeZIndex } = useFloatingPanelStack();

  const openFull = useCallback(() => setAboutView("full"), [setAboutView]);
  const closeFull = useCallback(() => {
    setAboutView(() =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches
        ? "minimized"
        : "peek",
    );
  }, [setAboutView]);

  useEffect(() => {
    if (aboutView !== "full") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [aboutView]);

  const toggleDock = useCallback(() => {
    setAboutView((v) => (v === "peek" ? "minimized" : "peek"));
  }, [setAboutView]);

  const peekOpen = aboutView === "peek";
  const peekClipClass = peekOpen
    ? "max-w-[calc(var(--width-about-panel)-var(--width-filter-narrow-column))] opacity-100"
    : "max-w-0 opacity-0 pointer-events-none";

  return (
    <>
      {aboutView !== "full" ? (
        <div
          className={`fixed top-8.5 right-8.5 hidden min-h-0 max-h-about-panel flex-row items-stretch overflow-hidden border-solid border-ink-primary bg-surface-canvas/90 shadow-none backdrop-blur-fae-md lg:flex ${
            peekOpen ? "border-hairline" : "border-hairline border-b-0"
          }`}
          style={{
            zIndex: getChromeZIndex("about", peekOpen ? "peek" : "minimized"),
            height: `${dockOuterH}px`,
            minHeight: `${dockOuterH}px`,
          }}
        >
          <AboutTabRail
            arrowClassName="-scale-x-100"
            onClick={toggleDock}
            ariaExpanded={peekOpen}
            ariaControls={panelId}
          />

          <div
            id={peekOpen ? panelId : undefined}
            role={peekOpen ? "region" : undefined}
            aria-label={peekOpen ? "About" : undefined}
            className={`h-full min-h-0 shrink-0 overflow-hidden ${FLOATING_DOCK_PEEK_CLIP_CLASS} ${peekClipClass}`}
          >
            <div className="flex h-full min-h-0 w-[calc(var(--width-about-panel)-var(--width-filter-narrow-column))] shrink-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5">
                <div className="font-suisseintl text-xs font-normal leading-[1.6] text-ink-body">
                  {ABOUT_BODY}
                </div>
              </div>

              <div className="shrink-0 pt-6">
                <button
                  type="button"
                  onClick={openFull}
                  className={fullScreenShowMoreLessButtonClass}
                >
                  <OpenSvgIcon className="shrink-0 rotate-180" />
                  <span className={fullScreenShowMoreLessLabelClass}>
                    Show more
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {aboutView === "full" && isMaxLg ? (
        <MobileAboutSheet
          zIndex={Z_INDEX.mobileAboutSheet}
          onClose={closeFull}
        />
      ) : null}
      {aboutView === "full" && !isMaxLg ? (
        <AboutFullScreenView
          zIndex={getChromeZIndex("about", "full")}
          onBackToPeek={closeFull}
        />
      ) : null}
    </>
  );
}
