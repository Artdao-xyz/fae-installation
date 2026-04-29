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
      role="radio"
      aria-checked={selected}
      title={title ?? label}
      className={`fae-control-filter-outer inline-flex max-w-full shrink-0 items-baseline ${filterFramedOuterFocusClass} ${filterPillSingleLayerBrightnessHoverClass} ${
        selected ? filterFramedRoundedOuterSelectedClass : ""
      } ${cursorClass}`}
    >
      <span
        className={`${filterFramedRoundedInnerClass(selected)} inline-flex h-[28px] items-center overflow-hidden transition-[width] duration-150 motion-reduce:transition-none ${
          selected ? "w-[100px] justify-center gap-1.5 px-0" : "w-[50px] justify-center px-0"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- filter button icons are local static SVG assets */}
        <img
          src="/svg/briefing.svg"
          alt=""
          width={14}
          height={14}
          className="h-3.5 w-3.5 shrink-0 object-contain"
          aria-hidden
        />
        {selected ? <span className="truncate">{label}</span> : null}
      </span>
    </button>
  );
}
