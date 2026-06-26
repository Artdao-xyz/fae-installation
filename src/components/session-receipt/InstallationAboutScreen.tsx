"use client";

import { AboutFullScreenRichContent } from "@/components/ui/about-panel/AboutShared";
import { OpenSvgIcon } from "@/components/ui/icons/OpenSvgIcon";
import {
  fullScreenContentInnerClass,
  fullScreenContentScrollClass,
  fullScreenContentShellClass,
  fullScreenContentShellEnterTransitionClass,
} from "@/components/ui/preview/fullScreenContentChrome";
import { installationOverlayZClass } from "./installation-screen-chrome";
import { useBodyScrollLock } from "./use-body-scroll-lock";
import {
  FULL_SCREEN_SHELL_TRANSITION_MS,
  useInstallationOverlayTransition,
} from "./use-installation-overlay-enter";

type InstallationAboutScreenProps = {
  open: boolean;
  onClose: () => void;
};

export function InstallationAboutScreen({ open, onClose }: InstallationAboutScreenProps) {
  const { mounted, entered } = useInstallationOverlayTransition(open, {
    durationMs: FULL_SCREEN_SHELL_TRANSITION_MS,
  });
  useBodyScrollLock(mounted);

  if (!mounted) return null;

  return (
    <div
      className={`${fullScreenContentShellClass} ${fullScreenContentShellEnterTransitionClass} ${installationOverlayZClass} ${
        entered ? "scale-100 opacity-100" : "scale-95 opacity-0"
      } motion-reduce:scale-100 motion-reduce:opacity-100`}
      role="dialog"
      aria-modal="true"
      aria-label="About Future Art Ecosystems"
    >
      <div className="flex w-full shrink-0 items-stretch border-b-hairline border-solid border-border bg-surface-canvas">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-full items-center justify-center gap-2 px-3 font-fira-mono text-sm font-normal leading-5 text-ink-primary transition-colors hover:bg-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-primary"
          aria-label="Back to intro"
        >
          <OpenSvgIcon className="shrink-0 rotate-90" />
          <span>Back</span>
        </button>
      </div>
      <div className={fullScreenContentScrollClass}>
        <div className={`${fullScreenContentInnerClass} max-w-[645px]`}>
          <AboutFullScreenRichContent />
        </div>
      </div>
    </div>
  );
}
