"use client";

import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";

type MobileFiltersCloseHeaderProps = {
  onClose: () => void;
};

/** Close strip at the bottom of the mobile filter sheet, directly above category rails / options. */
export function MobileFiltersCloseHeader({ onClose }: MobileFiltersCloseHeaderProps) {
  return (
    <div
      className="flex w-full shrink-0 items-stretch border-t-hairline border-b-hairline border-solid border-border bg-surface-canvas lg:hidden"
      role="presentation"
    >
      <button
        type="button"
        onClick={onClose}
        className="flex h-13 flex-1 items-center justify-center gap-2 px-3 font-fira-mono text-sm font-normal leading-5 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
        aria-label="Close filters"
      >
        <OpenSvgIcon className="shrink-0 rotate-90" />
        <span>Close</span>
      </button>
    </div>
  );
}
