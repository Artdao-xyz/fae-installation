"use client";

import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";

type MobileFiltersCloseHeaderProps = {
  onClose: () => void;
};

/** Fixed top strip below safe-area when the filter sheet is full-screen on `max-lg`. */
export function MobileFiltersCloseHeader({ onClose }: MobileFiltersCloseHeaderProps) {
  return (
    <div
      className="flex w-full shrink-0 items-stretch border-b-hairline border-solid border-ink-primary bg-surface-canvas lg:hidden"
      role="presentation"
    >
      <button
        type="button"
        onClick={onClose}
        className="flex h-11 w-full items-center justify-center gap-2 px-3 font-fira-mono text-sm font-normal leading-5 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
        aria-label="Close filters"
      >
        <OpenSvgIcon className="shrink-0 rotate-90" />
        <span>Close</span>
      </button>
    </div>
  );
}
