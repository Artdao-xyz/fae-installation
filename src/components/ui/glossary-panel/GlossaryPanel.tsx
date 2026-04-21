"use client";

import { useCallback, useEffect, useId } from "react";
import { useFloatingPanelStack } from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { FLOATING_DOCK_PEEK_CLIP_CLASS } from "@/components/ui/filter-sidebar/shell/layout-classes";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import {
  navMarkIconImgClassName,
  navSidebarVerticalLabelClassName,
} from "@/components/ui/icons/nav-sidebar-labels";
import {
  floatingDockPanelOuterHeightPx,
  RIGHT_FLOAT_VIEWPORT_INSET,
} from "@/components/ui/floating-panels/right-rail-stack";
import { GLOSSARY_PANEL_ENTRIES } from "@/data/glossary-panel-content";

function GlossaryTabRail({
  arrowClassName,
  onClick,
  ariaExpanded,
  ariaControls,
  fillColumn = false,
}: {
  arrowClassName?: string;
  onClick: () => void;
  ariaExpanded: boolean;
  ariaControls: string;
  fillColumn?: boolean;
}) {
  const sizeClassName = fillColumn
    ? "min-h-0 w-filter-narrow-column shrink-0 flex-1"
    : "h-full min-h-0 w-filter-narrow-column shrink-0 self-stretch";

  return (
    <button
      type="button"
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      onClick={onClick}
      className={`flex flex-col items-center border-b-0 border-solid border-ink-primary bg-surface-canvas/90 py-2.5 backdrop-blur-fae-sm transition-colors hover:bg-surface-hover/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${sizeClassName} ${
        ariaExpanded ? "border-r-hairline" : ""
      }`}
    >
      <div className="flex min-h-[72px] w-full flex-1 flex-col items-center justify-between px-0.5">
        <OpenSvgIcon
          className={`${arrowClassName ?? ""} transition-transform duration-500 ease-in-out motion-reduce:transition-none ${
            ariaExpanded ? "rotate-180" : ""
          }`}
        />
        <span className={navSidebarVerticalLabelClassName}>Glossary</span>
      </div>
      <img
        src="/svg/glossary.svg"
        alt=""
        className={`${navMarkIconImgClassName} mt-2 shrink-0`}
        aria-hidden
        draggable={false}
      />
    </button>
  );
}

export function GlossaryPanel() {
  const panelId = useId();
  const { glossaryView, setGlossaryView, getChromeZIndex } =
    useFloatingPanelStack();
  const dockOuterH = floatingDockPanelOuterHeightPx();

  const peekOpen = glossaryView === "peek";

  const toggleDock = useCallback(() => {
    setGlossaryView((v) => (v === "peek" ? "minimized" : "peek"));
  }, [setGlossaryView]);

  const minimize = useCallback(() => setGlossaryView("minimized"), [setGlossaryView]);

  useEffect(() => {
    if (!peekOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") minimize();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [peekOpen, minimize]);

  const peekClipClass = peekOpen
    ? "max-w-[var(--width-glossary-panel)] opacity-100"
    : "max-w-0 opacity-0 pointer-events-none";

  return (
    <div
      className={`fixed right-8.5 flex min-h-0 flex-row items-stretch overflow-hidden border-solid border-ink-primary bg-surface-canvas/90 ${
        peekOpen
          ? "border-hairline"
          : "border-b-0 border-l-hairline border-r-hairline border-t-hairline"
      }`}
      style={{
        zIndex: getChromeZIndex("glossary", peekOpen ? "peek" : "minimized"),
        ...(peekOpen
          ? {
              top: RIGHT_FLOAT_VIEWPORT_INSET,
              bottom: RIGHT_FLOAT_VIEWPORT_INSET,
            }
          : {
              top: `calc(${RIGHT_FLOAT_VIEWPORT_INSET} + ${dockOuterH}px)`,
              bottom: `calc(${RIGHT_FLOAT_VIEWPORT_INSET} + ${dockOuterH}px)`,
            }),
      }}
    >
      <GlossaryTabRail
        fillColumn
        arrowClassName="-scale-x-100"
        onClick={toggleDock}
        ariaExpanded={peekOpen}
        ariaControls={panelId}
      />

      <div
        id={peekOpen ? panelId : undefined}
        role={peekOpen ? "region" : undefined}
        aria-label={peekOpen ? "Term definitions" : undefined}
        className={`flex h-full min-h-0 shrink-0 overflow-hidden ${FLOATING_DOCK_PEEK_CLIP_CLASS} ${peekClipClass}`}
      >
        <div className="flex h-full min-h-0 w-glossary-panel min-w-0 flex-1 flex-col bg-surface-canvas/90 shadow-none backdrop-blur-fae-md">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-4 scrollbar-hide">
            <div className="flex flex-col">
              {GLOSSARY_PANEL_ENTRIES.map((entry, index) => {
                const isLast = index === GLOSSARY_PANEL_ENTRIES.length - 1;
                return (
                  <article
                    key={entry.id}
                    className={`flex flex-col gap-2 pb-4 ${
                      index > 0 ? "pt-4" : ""
                    } ${
                      isLast
                        ? ""
                        : "border-b-hairline border-dotted border-ink-primary"
                    }`}
                  >
                    <h3 className="m-0 w-fit max-w-full self-start border-b-hairline border-r-hairline border-dotted border-ink-primary bg-white px-1 py-1 font-fira-mono text-xs font-normal leading-5 text-ink-body">
                      {entry.term}
                    </h3>
                    <p className="m-0 font-suisseintl text-xs font-normal leading-[1.6] tracking-[0.36px] text-ink-body">
                      {entry.definition}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
