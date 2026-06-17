"use client";

import type { ReactNode } from "react";

type InstallationChromeButtonProps = {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
  /** Hairline divider on the left — pair with an adjacent sibling (sidebar action row). */
  divided?: boolean;
  /** Full hairline frame for a lone control (e.g. modal). */
  framed?: boolean;
};

/** Sidebar chrome bar control — matches filter action rows / HomeBar dividers. */
const installationChromeButtonClass =
  "flex min-w-0 items-center justify-center gap-2 bg-surface-canvas font-fira-mono text-[12px] font-normal leading-4 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary";

export function InstallationChromeButton({
  children,
  onClick,
  className = "",
  autoFocus,
  "aria-label": ariaLabel,
  divided = false,
  framed = false,
}: InstallationChromeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      className={[
        installationChromeButtonClass,
        divided ? "border-l-hairline border-solid border-border" : "",
        framed ? "border-hairline border-solid border-border" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
