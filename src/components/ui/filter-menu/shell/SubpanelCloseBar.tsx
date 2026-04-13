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
      className="flex h-[22px] w-full shrink-0 items-center border-t-[0.5px] border-solid border-text-primary bg-white-fae px-3 text-text-primary hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-text-primary"
      aria-label="Close panel"
    >
      <OpenSvgIcon className="rotate-180" />
    </button>
  );
}
