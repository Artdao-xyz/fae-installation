"use client";

import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import {
  interactiveChromeHoverClass,
  interactiveChromeMatClass,
} from "@/components/ui/filter-sidebar/primitives/filterFramedClasses";

type SubpanelCloseBarProps = {
  onClose: () => void;
  /** Defaults to “Close panel” (subpanels). Use e.g. “Collapse preview” when the action is collapse, not dismiss. */
  ariaLabel?: string;
};

export function SubpanelCloseBar({ onClose, ariaLabel = "Close panel" }: SubpanelCloseBarProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={`flex h-filter-close-bar w-full shrink-0 items-center border-y-hairline border-solid border-ink-primary px-3 text-ink-primary ${interactiveChromeMatClass} ${interactiveChromeHoverClass} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary`}
      aria-label={ariaLabel}
    >
      <OpenSvgIcon className="rotate-180" />
    </button>
  );
}
