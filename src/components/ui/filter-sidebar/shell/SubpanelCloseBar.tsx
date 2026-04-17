"use client";

import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";

type SubpanelCloseBarProps = {
  onClose: () => void;
};

export function SubpanelCloseBar({ onClose }: SubpanelCloseBarProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="flex h-filter-close-bar w-full shrink-0 items-center border-y-hairline border-solid border-ink-primary bg-surface-canvas px-3 text-ink-primary hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
      aria-label="Close panel"
    >
      <OpenSvgIcon className="rotate-180" />
    </button>
  );
}
