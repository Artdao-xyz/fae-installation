"use client";

import { useEffect } from "react";
import { InstallationGlyphMark } from "./InstallationGlyphMark";
import { InstallationScreenContent } from "./InstallationScreenContent";
import {
  installationOverlayEnterClass,
  installationScreenStageClass,
  installationScreensaverBackdropClass,
  installationScreensaverGlyphSrc,
  installationScreenTitleBlockClass,
  installationScreensaverSubtitleClass,
  installationScreensaverTitleClass,
} from "./installation-screen-chrome";
import { useBodyScrollLock } from "./use-body-scroll-lock";
import { useInstallationOverlayTransition } from "./use-installation-overlay-enter";

const SCREENSAVER_CTA = "Touch or move to continue";

type InstallationScreensaverProps = {
  open: boolean;
  onDismiss: () => void;
};

export function InstallationScreensaver({
  open,
  onDismiss,
}: InstallationScreensaverProps) {
  const { mounted, entered } = useInstallationOverlayTransition(open);
  useBodyScrollLock(mounted);

  useEffect(() => {
    if (!mounted) return;

    const dismissOnPointerMove = () => {
      onDismiss();
    };

    window.addEventListener("mousemove", dismissOnPointerMove, { once: true });

    return () => {
      window.removeEventListener("mousemove", dismissOnPointerMove);
    };
  }, [mounted, onDismiss]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-300 cursor-default ${installationScreenStageClass} ${installationScreensaverBackdropClass} ${installationOverlayEnterClass} ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Future Art Ecosystems"
      onPointerDown={onDismiss}
    >
      <InstallationScreenContent>
        <InstallationGlyphMark
          src={installationScreensaverGlyphSrc}
          width={3776}
          height={3609}
          priority
        />
        <div className={installationScreenTitleBlockClass}>
          <div className={installationScreensaverTitleClass}>
            Future Art Ecosystems
          </div>
          <p className={installationScreensaverSubtitleClass}>
            Art and Advanced Technologies Research
          </p>
        </div>
        <p
          className={`text-left font-fira-mono text-xs leading-4 text-white/40 motion-safe:animate-pulse sm:text-sm sm:leading-5 ${
            entered ? "opacity-100" : "opacity-0"
          }`}
        >
          {SCREENSAVER_CTA}
        </p>
      </InstallationScreenContent>
    </div>
  );
}
