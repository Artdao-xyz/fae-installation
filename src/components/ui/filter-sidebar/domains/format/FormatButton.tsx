"use client";

import {
  filterFramedOuterFocusClass,
  filterFramedRoundedInnerClass,
  filterFramedRoundedOuterSelectedClass,
} from "../../primitives/filterFramedClasses";

type FormatButtonProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function FormatButton({
  label,
  selected = false,
  onPress,
}: FormatButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={`fae-control-filter-outer inline-flex max-w-full shrink-0 ${filterFramedOuterFocusClass} ${
        selected ? filterFramedRoundedOuterSelectedClass : ""
      }`}
    >
      <span className={filterFramedRoundedInnerClass(selected)}>{label}</span>
    </button>
  );
}
