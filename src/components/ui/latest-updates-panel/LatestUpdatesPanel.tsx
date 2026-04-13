"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import { UpdatesSvgIcon } from "@/components/ui/icons/UpdatesSvgIcon";
import { navRailVerticalLabelClassName } from "@/components/ui/icons/navChrome";
import {
  Thumbnail,
  getThumbnailFullCardOuterSize,
} from "@/components/ui/thumbnail-full";

type View = "minimized" | "peek";

/** Placeholder entries with real raster images until wired to CMS/API. */
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

/** Matches open state: one `lg` full thumbnail row + `py-5` padding (collapsed rail uses same height). */
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
  /** Separator between rail and content when rail is on the left. */
  showRightDivider?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      onClick={onClick}
      className={`flex h-full min-h-0 w-8 shrink-0 flex-col items-center justify-between border-solid border-text-primary bg-white-fae/90 px-0.5 py-2.5 backdrop-blur-[10px] transition-colors hover:bg-surface-hover/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-text-primary ${
        showRightDivider ? "border-r-[0.5px]" : ""
      } ${className}`}
    >
      <OpenSvgIcon className={`shrink-0 ${arrowClassName ?? ""}`} />
      <div className="flex shrink-0 flex-col items-center gap-2">
        <span className={navRailVerticalLabelClassName}>Latest Updates</span>
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
          className="fixed bottom-5 right-5 z-52 flex border-[0.5px] border-solid border-text-primary"
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
          className="fixed bottom-5 right-5 z-52 flex max-h-[min(85dvh,calc(100dvh-2.5rem))] w-max max-w-[calc(100vw-2.5rem)] flex-row items-stretch overflow-hidden border-[0.5px] border-solid border-text-primary bg-white-fae/90 shadow-none backdrop-blur-[25px] motion-reduce:transition-none"
          style={{ minHeight: UPDATES_PANEL_MIN_HEIGHT_PX }}
        >
          <LatestUpdatesTabRail
            onClick={minimize}
            ariaExpanded={true}
            ariaControls={panelId}
            showRightDivider
          />

          <div className="flex min-h-full min-w-0 flex-col justify-end overflow-x-auto overflow-y-auto overscroll-contain">
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
      ) : null}
    </>
  );
}
