"use client";

import Image from "next/image";
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
  fillAvailableWidth?: boolean;
};

const formatIconSrcByLabel: Record<string, string> = {
  Build: "/svg/build-icon.svg",
  Interact: "/svg/interact-icon.svg",
  Join: "/svg/join-icon.svg",
  Read: "/svg/read-icon.svg",
  View: "/svg/view-icon.svg",
};

export function FormatButton({
  label,
  selected = false,
  onPress,
  disabled = false,
  title,
  fillAvailableWidth = false,
}: FormatButtonProps) {
  const unavailable = disabled && !selected;
  const cursorClass = unavailable
    ? "!cursor-not-allowed opacity-45"
    : "cursor-pointer";
  const desktopHoverRevealClass =
    !selected && !unavailable
      ? fillAvailableWidth
        ? "lg:group-hover:w-auto lg:group-hover:gap-1.5 lg:group-hover:px-2"
        : "lg:group-hover:w-[100px] lg:group-hover:gap-1.5"
      : "";

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
      className={`fae-control-filter-outer group inline-flex items-baseline ${filterFramedOuterFocusClass} ${filterPillSingleLayerBrightnessHoverClass} ${
        selected ? filterFramedRoundedOuterSelectedClass : ""
      } ${
        fillAvailableWidth
          ? selected
            ? "w-auto min-w-max shrink-0 max-w-none"
            : "min-w-0 flex-1 basis-0 max-w-none"
          : "max-w-full shrink-0"
      } ${cursorClass}`}
    >
      <span
        className={`${filterFramedRoundedInnerClass(selected)} inline-flex h-[28px] items-center overflow-hidden transition-[width] duration-150 motion-reduce:transition-none ${
          fillAvailableWidth
            ? selected
              ? "w-auto justify-center gap-1.5 px-2"
              : "w-full justify-center px-0"
            : selected
              ? "w-[100px] justify-center gap-1.5 px-0"
              : "w-[50px] justify-center px-0"
        } ${desktopHoverRevealClass}`}
      >
        <Image
          src={formatIconSrcByLabel[label] ?? "/svg/view-icon.svg"}
          alt=""
          width={14}
          height={14}
          unoptimized
          className="h-3.5 w-3.5 shrink-0"
          aria-hidden
          draggable={false}
        />
        {selected || !unavailable ? (
          <span
            className={`${
              selected
                ? ""
                : "hidden lg:group-hover:block"
            } ${fillAvailableWidth ? "whitespace-nowrap" : "truncate"}`}
          >
            {label}
          </span>
        ) : null}
      </span>
    </button>
  );
}
