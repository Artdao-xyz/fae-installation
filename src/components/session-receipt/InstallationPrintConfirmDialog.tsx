"use client";

import {
  installationIntroButtonClass,
  installationModalOverlayClass,
  installationOverlayEnterClass,
  installationScreenActionsRowClass,
  installationScreenStageClass,
} from "./installation-screen-chrome";
import { useIsMaxLg } from "@/components/ui/filter-sidebar/shell/useIsMaxLg";
import { InstallationArrowIcon } from "./InstallationArrowIcon";
import { InstallationScreenContent } from "./InstallationScreenContent";
import { useBodyScrollLock } from "./use-body-scroll-lock";
import { useInstallationOverlayTransition } from "./use-installation-overlay-enter";

type InstallationPrintConfirmDialogProps = {
  open: boolean;
  minimalJourney?: boolean;
  onConfirm: () => void;
  onKeepExploring: () => void;
};

export function InstallationPrintConfirmDialog({
  open,
  minimalJourney = false,
  onConfirm,
  onKeepExploring,
}: InstallationPrintConfirmDialogProps) {
  const { mounted, entered } = useInstallationOverlayTransition(open);
  const isMaxLg = useIsMaxLg();
  useBodyScrollLock(mounted);

  if (!mounted) return null;

  return (
    <div
      className={`${installationModalOverlayClass} ${installationScreenStageClass} ${installationOverlayEnterClass} ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="End journey"
    >
      <InstallationScreenContent>
        <h2 className="font-lust-text text-left text-4xl leading-tight text-black-fae sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-[65px]">
          Your journey is about to end
        </h2>
        <p className="text-left font-fira-mono text-sm font-medium leading-5 text-black-fae/50 sm:text-base">
          {isMaxLg
            ? "Your path through Future Art Ecosystems will be transformed into a unique receipt you can scan and save."
            : "Your path through Future Art Ecosystems will be transformed into a unique receipt you can take home."}
        </p>
        {minimalJourney ? (
          <p className="text-left font-fira-mono text-xs leading-4 text-amber-900 sm:text-sm sm:leading-5">
            {isMaxLg
              ? "You have not explored yet — your receipt will be mostly empty. Keep exploring, or confirm to view anyway."
              : "You have not explored yet — your receipt will be mostly empty. Keep exploring, or confirm to print anyway."}
          </p>
        ) : null}

        <div className={installationScreenActionsRowClass}>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            aria-label={isMaxLg ? "Confirm and view receipt" : "Confirm and print receipt"}
            className={installationIntroButtonClass}
          >
            Confirm
            <InstallationArrowIcon className="block size-[10px] shrink-0 object-contain" />
          </button>
          <button
            type="button"
            onClick={onKeepExploring}
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
