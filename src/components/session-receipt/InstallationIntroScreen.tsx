"use client";

import { InstallationArrowIcon } from "./InstallationArrowIcon";
import { InstallationGlyphMark } from "./InstallationGlyphMark";
import { InstallationScreenContent } from "./InstallationScreenContent";
import {
  installationIntroButtonClass,
  installationIntroGlyphSrc,
  installationModalOverlayClass,
  installationOverlayEnterClass,
  installationScreenStageClass,
  installationScreenSubtitleClass,
  installationScreenTitleBlockClass,
  installationScreenTitleClass,
} from "./installation-screen-chrome";
import { useBodyScrollLock } from "./use-body-scroll-lock";
import { useInstallationOverlayTransition } from "./use-installation-overlay-enter";

type InstallationIntroScreenProps = {
  open: boolean;
  onReadAbout: () => void;
  onStartJourney: () => void;
};

export function InstallationIntroScreen({
  open,
  onReadAbout,
  onStartJourney,
}: InstallationIntroScreenProps) {
  const { mounted, entered } = useInstallationOverlayTransition(open);
  useBodyScrollLock(mounted);

  if (!mounted) return null;

  return (
    <div
      className={`${installationModalOverlayClass} ${installationScreenStageClass} ${installationOverlayEnterClass} ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Future Art Ecosystems"
    >
      <InstallationScreenContent>
        <InstallationGlyphMark
          src={installationIntroGlyphSrc}
          width={3664}
          height={3613}
          priority
        />
        <div className={installationScreenTitleBlockClass}>
          <div className={installationScreenTitleClass}>Future Art Ecosystems</div>
          <p className={installationScreenSubtitleClass}>
            Art and Advanced Technologies Research
          </p>
        </div>
        <div className="flex items-center gap-[5px]">
          <button
            type="button"
            onClick={onStartJourney}
            aria-label="Start journey"
            className={installationIntroButtonClass}
          >
            Start Journey
            <InstallationArrowIcon className="block size-[10px] shrink-0 object-contain" />
          </button>
          <button
            type="button"
            onClick={onReadAbout}
            aria-label="Read about exhibition"
            className={installationIntroButtonClass}
          >
            Read About Exhibition
            <InstallationArrowIcon className="block size-[10px] shrink-0 object-contain" />
          </button>
        </div>
      </InstallationScreenContent>
    </div>
  );
}
