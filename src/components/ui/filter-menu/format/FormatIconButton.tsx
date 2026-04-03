"use client";

import type { ComponentType } from "react";

type FormatIconButtonProps = {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  selected?: boolean;
  onPress?: () => void;
};

export function FormatIconButton({
  label,
  Icon,
  selected = false,
  onPress,
}: FormatIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={`flex h-[25px] w-[38px] shrink-0 items-center justify-center border-[0.5px] border-solid bg-white-fae/80 backdrop-blur-[25px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary focus-visible:ring-offset-0 ${
        selected
          ? "border-text-primary bg-text-primary text-white-fae"
          : "border-text-primary text-text-primary hover:bg-surface-hover/50"
      }`}
    >
      <Icon className="pointer-events-none h-3.5 w-auto max-w-[28px] shrink-0" />
    </button>
  );
}
