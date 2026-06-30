"use client";

import { useEffect } from "react";
import { InstallationGlyphMark } from "./InstallationGlyphMark";
import {
  installationOverlayBackdropClass,
  installationOverlayEnterClass,
  installationScreenStageClass,
  installationScreensaverGlyphSrc,
} from "./installation-screen-chrome";
import { useBodyScrollLock } from "./use-body-scroll-lock";
import { useDvdScreensaverMotion } from "./use-dvd-screensaver-motion";
import { useInstallationOverlayTransition } from "./use-installation-overlay-enter";

type InstallationScreensaverProps = {
  open: boolean;
  onDismiss: () => void;
};

export function InstallationScreensaver({
  open,
  onDismiss,
}: InstallationScreensaverProps) {
  const { mounted, entered } = useInstallationOverlayTransition(open);
  const { contentRef, reducedMotion } = useDvdScreensaverMotion(mounted);
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
      className={`fixed inset-0 z-300 cursor-default ${installationOverlayBackdropClass} ${
        reducedMotion ? installationScreenStageClass : "overflow-hidden"
      } ${installationOverlayEnterClass} ${entered ? "opacity-100" : "opacity-0"}`}
      role="dialog"
      aria-modal="true"
      aria-label="Screensaver"
      onPointerDown={onDismiss}
    >
      {reducedMotion ? (
        <InstallationGlyphMark
          src={installationScreensaverGlyphSrc}
          width={3776}
          height={3609}
          priority
        />
      ) : (
        <div
          ref={contentRef}
          className="absolute top-0 left-0 will-change-transform"
        >
          <InstallationGlyphMark
            src={installationScreensaverGlyphSrc}
            width={3776}
            height={3609}
            priority
          />
        </div>
      )}
    </div>
  );
}
