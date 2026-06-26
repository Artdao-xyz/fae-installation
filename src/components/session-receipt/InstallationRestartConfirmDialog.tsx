"use client";

import {
  installationIntroButtonClass,
  installationModalOverlayClass,
  installationOverlayEnterClass,
  installationScreenStageClass,
} from "./installation-screen-chrome";
import { InstallationArrowIcon } from "./InstallationArrowIcon";
import { InstallationScreenContent } from "./InstallationScreenContent";
import { useBodyScrollLock } from "./use-body-scroll-lock";
import { useInstallationOverlayTransition } from "./use-installation-overlay-enter";

type InstallationRestartConfirmDialogProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function InstallationRestartConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: InstallationRestartConfirmDialogProps) {
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
      aria-label="Restart session"
    >
      <InstallationScreenContent>
        <h2 className="font-lust-text text-left text-5xl leading-tight text-black-fae sm:text-6xl sm:leading-[65px]">
          Restart session?
        </h2>
        <p className="text-left font-fira-mono text-sm font-medium leading-5 text-black-fae/50 sm:text-base">
          Your current journey will be lost and cannot be recovered.
        </p>

        <div className="flex gap-[5px]">
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            aria-label="Confirm restart"
            className={installationIntroButtonClass}
          >
            Restart
            <InstallationArrowIcon className="block size-[10px] shrink-0 object-contain" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Keep exploring"
            className={installationIntroButtonClass}
          >
            Keep exploring
            <InstallationArrowIcon className="block size-[10px] shrink-0 object-contain" />
          </button>
        </div>
      </InstallationScreenContent>
    </div>
  );
}
