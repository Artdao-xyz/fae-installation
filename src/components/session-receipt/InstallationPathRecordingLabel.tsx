"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { marginGuideBottomStripRightClass } from "@/components/ui/margin-guide-frame/marginGuideChrome";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { Z_INDEX } from "@/lib/z-index-scale";
import {
  installationStatusChipClassName,
  installationStatusTextClassName,
} from "./installation-status-chip";
import { useSessionReceipt } from "./SessionReceiptProvider";

const ARTICLE_FLASH_MS = 3000;
const POINTER_SAMPLE_MS = 120;

function formatPointerSuffix(pointer: { x: number; y: number } | null): string {
  if (!pointer) return "—, —";
  return `${pointer.x}, ${pointer.y}`;
}

export function InstallationPathRecordingLabel() {
  const { enabled, recording, events, previewOpen, screensaverActive } =
    useSessionReceipt();
  const { contentPreviewRow } = useFilterSelection();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [flashTitle, setFlashTitle] = useState<string | null>(null);
  const lastPageTsRef = useRef<number | null>(null);
  const lastPointerSampleRef = useRef(0);
  const flashTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!recording || typeof window === "undefined") return;

    const onPointerMove = (event: PointerEvent) => {
      const now = Date.now();
      if (now - lastPointerSampleRef.current < POINTER_SAMPLE_MS) return;
      lastPointerSampleRef.current = now;
      setPointer({
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [recording]);

  useEffect(() => {
    if (!recording) return;

    const lastPage = [...events].reverse().find((event) => event.type === "page");
    if (!lastPage) return;

    const displayName = contentPreviewRow?.shortTitle ?? lastPage.title;

    if (lastPageTsRef.current !== lastPage.ts) {
      lastPageTsRef.current = lastPage.ts;

      if (flashTimeoutRef.current != null) {
        window.clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = null;
      }

      window.setTimeout(() => {
        setFlashTitle(displayName);
        flashTimeoutRef.current = window.setTimeout(() => {
          setFlashTitle(null);
          flashTimeoutRef.current = null;
        }, ARTICLE_FLASH_MS);
      }, 0);
      return;
    }

    if (flashTimeoutRef.current != null && contentPreviewRow?.shortTitle) {
      window.setTimeout(() => {
        setFlashTitle(contentPreviewRow.shortTitle ?? null);
      }, 0);
    }
  }, [events, recording, contentPreviewRow?.shortTitle]);

  useEffect(() => {
    if (recording) return;
    if (flashTimeoutRef.current != null) {
      window.clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = null;
    }
    lastPageTsRef.current = null;
  }, [recording]);

  useEffect(
    () => () => {
      if (flashTimeoutRef.current != null) {
        window.clearTimeout(flashTimeoutRef.current);
      }
    },
    [],
  );

  const dockedPreviewOpen = contentPreviewRow != null;

  if (!enabled || !recording || screensaverActive || previewOpen || !mounted) {
    return null;
  }

  const suffix = flashTitle ?? formatPointerSuffix(pointer);
  const message = `Your path is being recorded: ${suffix}`;

  return createPortal(
    <div
      className={[
        "pointer-events-none mr-2",
        marginGuideBottomStripRightClass,
        dockedPreviewOpen
          ? "right-[calc(var(--inset-margin-guide)+var(--width-preview-panel))]"
          : "",
        "max-lg:bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] max-lg:right-5 max-lg:h-auto",
      ].join(" ")}
      style={{ zIndex: Z_INDEX.guiFloatingDock }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`${installationStatusChipClassName} max-w-[min(281px,calc(100vw-2*var(--inset-margin-guide)))]`}
      >
        <span className={`${installationStatusTextClassName} min-w-0 truncate`}>
          {message}
        </span>
      </div>
    </div>,
    document.body,
  );
}
