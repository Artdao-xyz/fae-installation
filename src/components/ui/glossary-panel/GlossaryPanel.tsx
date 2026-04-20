"use client";

import { useCallback, useEffect, useId, useState } from "react";
import {
  useFloatingPanelPhase,
  useFloatingPanelStack,
} from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import {
  navMarkIconImgClassName,
  navSidebarVerticalLabelClassName,
} from "@/components/ui/icons/nav-sidebar-labels";
import {
  ABOUT_MINIMIZED_RAIL_HEIGHT_PX,
  RIGHT_FLOAT_VIEWPORT_INSET,
  fellowshipsMinimizedOuterHeightPx,
} from "@/components/ui/floating-panels/right-rail-stack";
import {
  GLOSSARY_PANEL_ENTRIES,
} from "@/data/glossary-panel-content";

type View = "minimized" | "peek";

function GlossaryTabRail({
  arrowClassName,
  onClick,
  ariaExpanded,
  ariaControls,
  showRightDivider = false,
  fillColumn = false,
}: {
  arrowClassName?: string;
  onClick: () => void;
  ariaExpanded: boolean;
  ariaControls: string;
  showRightDivider?: boolean;
  /** When true, rail stretches vertically like `flex-1` between About and Fellowships. */
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
      className={`flex flex-col items-center border-solid border-ink-primary bg-surface-canvas/90 py-2.5 backdrop-blur-fae-sm transition-colors hover:bg-surface-hover/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${sizeClassName} ${
        showRightDivider ? "border-r-hairline" : ""
      }`}
    >
      <div className="flex min-h-[72px] w-full flex-1 flex-col items-center justify-between px-0.5">
        <OpenSvgIcon className={arrowClassName ?? ""} />
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
  const [view, setView] = useState<View>("minimized");
  const { getChromeZIndex } = useFloatingPanelStack();
  useFloatingPanelPhase("glossary", view);
  const fellowshipsMinimizedH = fellowshipsMinimizedOuterHeightPx();

  const openPeek = useCallback(() => setView("peek"), []);
  const minimize = useCallback(() => setView("minimized"), []);

  useEffect(() => {
    if (view !== "peek") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") minimize();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, minimize]);

  return (
    <>
      {view === "minimized" ? (
        <div
          className="fixed right-8.5 flex min-h-0 flex-col items-stretch border-t-hairline border-l-hairline border-r-hairline border-b-0 border-solid border-ink-primary"
          style={{
            zIndex: getChromeZIndex("glossary", "minimized"),
            top: `calc(${RIGHT_FLOAT_VIEWPORT_INSET} + ${ABOUT_MINIMIZED_RAIL_HEIGHT_PX}px)`,
            bottom: `calc(${RIGHT_FLOAT_VIEWPORT_INSET} + ${fellowshipsMinimizedH}px)`,
          }}
        >
          <GlossaryTabRail
            fillColumn
            arrowClassName="-scale-x-100"
            onClick={openPeek}
            ariaExpanded={false}
            ariaControls={panelId}
          />
        </div>
      ) : null}

      {view === "peek" ? (
        <div
          id={panelId}
          role="region"
          aria-label="Term definitions"
          className="fixed top-8.5 right-8.5 bottom-8.5 flex max-h-[calc(100dvh-4.25rem)] w-max max-w-floating-panel overflow-hidden border-hairline border-solid border-ink-primary bg-surface-canvas/90 shadow-none backdrop-blur-fae-md motion-reduce:transition-none"
          style={{ zIndex: getChromeZIndex("glossary", "peek") }}
        >
          <div className="flex h-full min-h-0 w-max min-w-0 flex-row items-stretch">
            <GlossaryTabRail
              onClick={minimize}
              ariaExpanded={true}
              ariaControls={panelId}
              showRightDivider
            />

            <div className="flex h-full min-h-0 w-glossary-panel min-w-0 flex-1 flex-col">
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
      ) : null}
    </>
  );
}
