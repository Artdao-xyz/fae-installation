"use client";

import { useCallback, useEffect, useId, useState } from "react";
import {
  useFloatingPanelPhase,
  useFloatingPanelStack,
} from "@/components/ui/floating-panels/FloatingPanelStackContext";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { FellowshipsSvgIcon } from "@/components/ui/icons/FellowshipsSvgIcon";
import { navSidebarVerticalLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";
import { fellowshipsMinimizedOuterHeightPx } from "@/components/ui/floating-panels/right-rail-stack";
import { Thumbnail } from "@/components/ui/thumbnail-full";

type View = "minimized" | "peek";

const FELLOWSHIPS_THUMBNAILS = [
  {
    label: "Synthetic Commons",
    imageSrc: "https://picsum.photos/seed/fae-upd-1/440/440",
    imageAlt: "Synthetic Commons",
  },
  {
    label: "Protocol Garden",
    imageSrc: "https://picsum.photos/seed/fae-upd-2/440/440",
    imageAlt: "Protocol Garden",
  },
  {
    label: "Node Atlas",
    imageSrc: "https://picsum.photos/seed/fae-upd-3/440/440",
    imageAlt: "Node Atlas",
  },
] as const;

function FellowshipsTabRail({
  arrowClassName,
  onClick,
  ariaExpanded,
  ariaControls,
  showRightDivider = false,
  className = "",
}: {
  arrowClassName?: string;
  onClick: () => void;
  ariaExpanded: boolean;
  ariaControls: string;
  showRightDivider?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      onClick={onClick}
      className={`flex min-h-0 w-filter-narrow-column shrink-0 flex-col items-center justify-between self-stretch border-solid border-ink-primary bg-surface-canvas/90 px-0.5 py-2.5 backdrop-blur-fae-sm transition-colors hover:bg-surface-hover/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary ${
        showRightDivider ? "border-r-hairline" : ""
      } ${className}`}
    >
      <OpenSvgIcon className={`shrink-0 ${arrowClassName ?? ""}`} />
      <div className="flex shrink-0 flex-col items-center gap-2">
        <span className={navSidebarVerticalLabelClassName}>Fellowships</span>
        <FellowshipsSvgIcon />
      </div>
    </button>
  );
}

export function FellowshipsPanel() {
  const panelId = useId();
  const [view, setView] = useState<View>("minimized");
  const { getChromeZIndex } = useFloatingPanelStack();
  useFloatingPanelPhase("fellowships", view);
  const fellowshipsMinimizedOuterH = fellowshipsMinimizedOuterHeightPx();

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
          className="fixed bottom-8.5 right-8.5 flex border-hairline border-solid border-ink-primary"
          style={{
            zIndex: getChromeZIndex("fellowships", "minimized"),
            height: fellowshipsMinimizedOuterH,
          }}
        >
          <FellowshipsTabRail
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
          aria-label="Fellowships"
          className="fixed bottom-8.5 right-8.5 max-h-fellowships-panel w-max max-w-floating-panel overflow-hidden border-hairline border-solid border-ink-primary bg-surface-canvas/90 shadow-none backdrop-blur-fae-md motion-reduce:transition-none"
          style={{
            zIndex: getChromeZIndex("fellowships", "peek"),
            minHeight: fellowshipsMinimizedOuterH,
          }}
        >
          <div className="flex min-h-0 w-max min-w-0 flex-row items-stretch">
            <FellowshipsTabRail
              onClick={minimize}
              ariaExpanded={true}
              ariaControls={panelId}
              showRightDivider
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-end overflow-x-auto overflow-y-auto overscroll-contain">
              <div className="flex w-max flex-row flex-nowrap items-end gap-6 px-4 py-5 sm:gap-8 sm:px-6">
                {FELLOWSHIPS_THUMBNAILS.map((item) => (
                  <Thumbnail
                    key={item.label}
                    variant="full"
                    size="lg"
                    label={item.label}
                    imageSrc={item.imageSrc}
                    imageAlt={item.imageAlt}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
