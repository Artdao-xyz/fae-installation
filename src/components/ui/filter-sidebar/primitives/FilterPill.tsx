"use client";

import { useState } from "react";
import type { FilterSidebarCategoryTone } from "../config/filterSidebarTones";

type FilterPillProps = {
  label: string;
  tone?: FilterSidebarCategoryTone;
  expanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
  selected?: boolean;
  onPress?: () => void;
};

export function FilterPill({
  label,
  tone = "fae-briefings",
  expanded: expandedProp,
  onExpandedChange,
  selected = false,
  onPress,
}: FilterPillProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = expandedProp !== undefined;
  const isOpen = controlled ? expandedProp : internalOpen;

  const setOpen = (next: boolean) => {
    if (!controlled) setInternalOpen(next);
    onExpandedChange?.(next);
  };

  const expandable =
    onExpandedChange !== undefined || expandedProp !== undefined;

  const toggle = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (!expandable) return;
    setOpen(!isOpen);
  };

  const innerMuted = selected
    ? "bg-ink-primary text-surface-canvas"
    : "bg-surface-canvas text-ink-primary";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={expandable ? isOpen : undefined}
      aria-pressed={onPress ? selected : undefined}
      className="flex cursor-pointer items-center border-hairline border-solid border-ink-primary bg-ink-primary p-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-0"
      data-tone={tone}
    >
      <span
        className={`whitespace-nowrap rounded px-2.5 py-[5px] text-center font-fira-mono text-xs font-normal leading-4 ${innerMuted}`}
      >
        {label}
      </span>
    </button>
  );
}
