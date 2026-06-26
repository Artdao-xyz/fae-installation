"use client";

import { Z_INDEX } from "@/lib/z-index-scale";

type InstallationIdleWarningProps = {
  secondsRemaining: number;
};

export function InstallationIdleWarning({
  secondsRemaining,
}: InstallationIdleWarningProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-6"
      style={{ zIndex: Z_INDEX.guiFloatingDock }}
      role="status"
      aria-live="assertive"
      aria-atomic="true"
    >
      <p className="max-w-md rounded-sm border-thin border-solid border-amber-700/30 bg-amber-50/95 px-4 py-2 text-center font-fira-mono text-xs leading-4 text-amber-950 shadow-[0px_4px_10px_0px_rgba(0,0,0,0.05)] sm:text-sm sm:leading-5">
        Session resets in {secondsRemaining}s — touch the screen to stay
      </p>
    </div>
  );
}
