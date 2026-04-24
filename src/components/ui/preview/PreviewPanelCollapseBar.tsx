"use client";

import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";

type PreviewPanelCollapseBarProps = {
  onClose: () => void;
  ariaLabel: string;
};

/**
 * Same chrome as filter `SubpanelCloseBar`, but the open chevron is rotated for the right-edge
 * preview (arrow points left / “toward” the canvas).
 */
export function PreviewPanelCollapseBar({
  onClose,
  ariaLabel,
}: PreviewPanelCollapseBarProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      className="flex h-filter-close-bar w-full shrink-0 items-center border-b-hairline border-solid border-ink-primary bg-surface-canvas px-3 text-ink-primary hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
      aria-label={ariaLabel}
    >
      <OpenSvgIcon />
    </button>
  );
}
