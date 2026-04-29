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
  /** Use when parent wrapper already renders the top hairline to avoid a double top border. */
  showTopBorder?: boolean;
};

export function SubpanelCloseBar({
  onClose,
  ariaLabel = "Close panel",
  showTopBorder = true,
}: SubpanelCloseBarProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={`flex h-filter-close-bar w-full shrink-0 items-center border-b-hairline border-solid border-ink-primary ${showTopBorder ? "border-t-hairline" : "border-t-0"} px-3 text-ink-primary ${interactiveChromeMatClass} ${interactiveChromeHoverClass} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary`}
      aria-label={ariaLabel}
    >
      <OpenSvgIcon className="rotate-180" />
    </button>
  );
}
