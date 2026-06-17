"use client";

import { useEffect } from "react";
import {
  filterFramedOuterFocusClass,
  filterPillSingleLayerBrightnessHoverClass,
  interactiveChromeMatClass,
} from "@/components/ui/filter-sidebar/primitives/filterFramedClasses";

type SessionStartDialogProps = {
  onStart: () => void;
};

export function SessionStartDialog({ onStart }: SessionStartDialogProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Start session"
    >
      <div className="flex w-full max-w-xs flex-col items-stretch gap-3">
        <button
          type="button"
          onClick={onStart}
          autoFocus
          aria-label="Start session"
          className={[
            "inline-flex w-full min-h-12 items-center justify-center px-4 py-3",
            "[border-width:var(--border-width-thin)] border-solid border-ink-primary",
            interactiveChromeMatClass,
            filterPillSingleLayerBrightnessHoverClass,
            filterFramedOuterFocusClass,
            "font-fira-mono text-base leading-6 text-ink-primary",
          ].join(" ")}
        >
          Start
        </button>
      </div>
    </div>
  );
}
