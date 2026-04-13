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
      className={`flex h-format-icon w-format-icon shrink-0 items-center justify-center border-hairline border-solid bg-surface-canvas/80 backdrop-blur-fae-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary focus-visible:ring-offset-0 ${
        selected
          ? "border-ink-primary bg-ink-primary text-surface-canvas"
          : "border-ink-primary text-ink-primary hover:bg-surface-hover/50"
      }`}
    >
      <Icon className="pointer-events-none h-3.5 w-auto max-w-[28px] shrink-0" />
    </button>
  );
}
