"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { UpdatesSvgIcon } from "@/components/ui/icons/UpdatesSvgIcon";
import { navSidebarVerticalLabelClassName } from "@/components/ui/icons/nav-sidebar-labels";
import {
  Thumbnail,
  getThumbnailFullCardOuterSize,
} from "@/components/ui/thumbnail-full";

type View = "minimized" | "peek";

const LATEST_UPDATES_THUMBNAILS = [
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

const UPDATES_PANEL_MIN_HEIGHT_PX =
  getThumbnailFullCardOuterSize("lg").height + 40;

function LatestUpdatesTabRail({
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
        <span className={navSidebarVerticalLabelClassName}>Latest Updates</span>
        <UpdatesSvgIcon />
      </div>
    </button>
  );
}

export function LatestUpdatesPanel() {
  const panelId = useId();
  const [view, setView] = useState<View>("minimized");

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
          className="fixed bottom-8.5 right-8.5 z-52 flex border-hairline border-solid border-ink-primary"
          style={{ height: UPDATES_PANEL_MIN_HEIGHT_PX }}
        >
          <LatestUpdatesTabRail
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
          aria-label="Latest updates"
          className="fixed bottom-8.5 right-8.5 z-52 max-h-updates-panel w-max max-w-floating-panel overflow-hidden border-hairline border-solid border-ink-primary bg-surface-canvas/90 shadow-none backdrop-blur-fae-md motion-reduce:transition-none"
          style={{ minHeight: UPDATES_PANEL_MIN_HEIGHT_PX }}
        >
          <div className="flex min-h-0 w-max min-w-0 flex-row items-stretch">
            <LatestUpdatesTabRail
              onClick={minimize}
              ariaExpanded={true}
              ariaControls={panelId}
              showRightDivider
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-end overflow-x-auto overflow-y-auto overscroll-contain">
              <div className="flex w-max flex-row flex-nowrap items-end gap-6 px-4 py-5 sm:gap-8 sm:px-6">
                {LATEST_UPDATES_THUMBNAILS.map((item) => (
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
