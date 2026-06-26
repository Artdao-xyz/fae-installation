"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { marginGuideTopStripRightClass } from "@/components/ui/margin-guide-frame/marginGuideChrome";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { Z_INDEX } from "@/lib/z-index-scale";
import {
  installationStatusChipClassName,
  installationStatusTextClassName,
} from "./installation-status-chip";
import { useSessionReceipt } from "./SessionReceiptProvider";

/** Star scale steps in the Figma journey-progress row (px). */
const JOURNEY_STAR_SIZES = [4, 4, 6, 6, 8, 8] as const;

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

function useSessionElapsed(sessionStart: string, active: boolean): string {
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    if (!active || !sessionStart) return;

    const startMs = Date.parse(sessionStart);
    if (!Number.isFinite(startMs)) return;

    const tick = () => setElapsed(formatElapsed(Date.now() - startMs));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [sessionStart, active]);

  if (!active || !sessionStart) return "00:00:00";
  const startMs = Date.parse(sessionStart);
  if (!Number.isFinite(startMs)) return "00:00:00";
  return elapsed;
}

export function InstallationRecordingIndicator() {
  const { enabled, recording, sessionStart, previewOpen, screensaverActive } =
    useSessionReceipt();
  const { contentPreviewRow } = useFilterSelection();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const elapsed = useSessionElapsed(sessionStart, recording);

  const dockedPreviewOpen = contentPreviewRow != null;

  if (!enabled || !recording || screensaverActive || previewOpen || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className={[
        "pointer-events-none mr-2",
        marginGuideTopStripRightClass,
        dockedPreviewOpen
          ? "right-[calc(var(--inset-margin-guide)+var(--width-preview-panel))]"
          : "",
        "max-lg:top-[calc(env(safe-area-inset-top,0px)+3.25rem+0.625rem)] max-lg:right-5 max-lg:h-auto",
      ].join(" ")}
      style={{ zIndex: Z_INDEX.guiFloatingDock }}
      role="status"
      aria-live="polite"
      aria-label={`Journey in progress, elapsed ${elapsed}`}
    >
      <div className={`${installationStatusChipClassName} gap-[10px]`}>
        <div className="flex items-center gap-[3px]" aria-hidden>
          {JOURNEY_STAR_SIZES.map((size, index) => (
            <div
              key={index}
              className="flex size-2 shrink-0 items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- small static chrome icon */}
              <img
                src="/svg/star-blue.svg"
                alt=""
                width={11}
                height={11}
                className="block shrink-0 object-contain"
                style={{ width: size, height: size }}
              />
            </div>
          ))}
        </div>
        <span className={`shrink-0 ${installationStatusTextClassName}`}>
          Journey in progress
        </span>
        <span
          className={`shrink-0 tabular-nums ${installationStatusTextClassName}`}
        >
          {elapsed}
        </span>
      </div>
    </div>,
    document.body,
  );
}
