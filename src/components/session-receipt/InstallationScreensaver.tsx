"use client";

import { useEffect } from "react";
import { InstallationGlyphMark } from "./InstallationGlyphMark";
import { InstallationScreenContent } from "./InstallationScreenContent";
import {
  installationOverlayBackdropClass,
  installationOverlayEnterClass,
  installationScreenStageClass,
  installationScreensaverGlyphSrc,
  installationScreensaverSubtitleClass,
  installationScreensaverTitleBlockClass,
  installationScreensaverTitleClass,
} from "./installation-screen-chrome";
import { useBodyScrollLock } from "./use-body-scroll-lock";
import { useDvdScreensaverMotion } from "./use-dvd-screensaver-motion";
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

  const staticTextBlock = (
    <>
      <div className={installationScreensaverTitleBlockClass}>
        <div className={installationScreensaverTitleClass}>
          Future Art Ecosystems
        </div>
        <p className={installationScreensaverSubtitleClass}>
          Art and Advanced Technologies Research
        </p>
      </div>
      <p
        className={`w-full text-center font-fira-mono text-xs leading-4 text-black-fae/40 motion-safe:animate-pulse sm:text-sm sm:leading-5 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
      >
        {SCREENSAVER_CTA}
      </p>
    </>
  );

  return (
    <div
      className={`fixed inset-0 z-300 cursor-default ${installationOverlayBackdropClass} ${
        reducedMotion ? installationScreenStageClass : "overflow-hidden"
      } ${installationOverlayEnterClass} ${entered ? "opacity-100" : "opacity-0"}`}
      role="dialog"
      aria-modal="true"
      aria-label="Future Art Ecosystems"
      onPointerDown={onDismiss}
    >
      {reducedMotion ? (
        <InstallationScreenContent className="items-center">
          <InstallationGlyphMark
            src={installationScreensaverGlyphSrc}
            width={3776}
            height={3609}
            priority
          />
          {staticTextBlock}
        </InstallationScreenContent>
      ) : (
        <>
          <div
            className={`${installationScreenStageClass} pointer-events-none absolute inset-0`}
          >
            <InstallationScreenContent className="items-center">
              {staticTextBlock}
            </InstallationScreenContent>
          </div>
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
        </>
      )}
    </div>
  );
}
