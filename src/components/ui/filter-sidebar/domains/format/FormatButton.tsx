"use client";

import {
  filterFramedOuterFocusClass,
  filterFramedRoundedInnerClass,
  filterFramedRoundedOuterSelectedClass,
  filterPillSingleLayerBrightnessHoverClass,
} from "../../primitives/filterFramedClasses";

type FormatButtonProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  title?: string;
};

export function FormatButton({
  label,
  selected = false,
  onPress,
  disabled = false,
  title,
}: FormatButtonProps) {
  const unavailable = disabled && !selected;
  const cursorClass = unavailable
    ? "!cursor-not-allowed opacity-45"
    : "cursor-pointer";

  return (
    <button
      type="button"
      onClick={() => {
        if (unavailable) return;
        onPress?.();
      }}
      disabled={unavailable}
      aria-disabled={unavailable ? true : undefined}
      aria-label={label}
      aria-pressed={selected}
      title={title ?? label}
      className={`fae-control-filter-outer inline-flex max-w-full shrink-0 items-baseline ${filterFramedOuterFocusClass} ${filterPillSingleLayerBrightnessHoverClass} ${
        selected ? filterFramedRoundedOuterSelectedClass : ""
      } ${cursorClass}`}
    >
      <span className={filterFramedRoundedInnerClass(selected)}>{label}</span>
    </button>
  );
}
