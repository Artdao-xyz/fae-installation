"use client";

import { useCallback, useMemo } from "react";
import { useFilterSelection } from "@/components/ui/filter-sidebar/FilterSelectionContext";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { useIdleTimeoutWithWarning } from "@/hooks/use-idle-timeout-with-warning";
import {
  resolveIdleWarningBeforeMs,
  resolveInstallationIdleTimeoutMs,
  resolveReceiptIdleTimeoutMs,
} from "@/lib/installation/idle";
import { InstallationIdleWarning } from "./InstallationIdleWarning";
import { InstallationScreensaver } from "./InstallationScreensaver";
import { useSessionReceipt } from "./SessionReceiptProvider";

export function InstallationIdleGuard() {
  const {
    enabled,
    recording,
    previewOpen,
    printStatus,
    aboutOpen,
    clearSession,
    screensaverActive,
    enterScreensaver,
    dismissScreensaver,
  } = useSessionReceipt();
  const { resetToIdle, setFiltersPanelOpen } = useFilterSelection();

  const idleTimeoutMs = useMemo(() => resolveInstallationIdleTimeoutMs(), []);
  const receiptTimeoutMs = useMemo(() => resolveReceiptIdleTimeoutMs(), []);
  const warningBeforeMs = useMemo(() => resolveIdleWarningBeforeMs(), []);

  const handleIdle = useCallback(() => {
    clearSession();
    resetToIdle();
    setFiltersPanelOpen(false);
    enterScreensaver();
  }, [clearSession, resetToIdle, setFiltersPanelOpen, enterScreensaver]);

  const idleBlocked =
    !enabled || screensaverActive || printStatus === "printing";

  const sessionIdleEnabled =
    !idleBlocked && recording && !aboutOpen && !previewOpen;

  const ambientIdleEnabled =
    !idleBlocked && !recording && !aboutOpen && !previewOpen;

  const aboutIdleEnabled = !idleBlocked && aboutOpen && !previewOpen;

  const receiptIdleEnabled = !idleBlocked && previewOpen;

  const { warningActive, secondsRemaining } = useIdleTimeoutWithWarning(
    idleTimeoutMs,
    warningBeforeMs,
    handleIdle,
    sessionIdleEnabled,
  );

  useIdleTimeout(idleTimeoutMs, handleIdle, ambientIdleEnabled);
  useIdleTimeout(idleTimeoutMs, handleIdle, aboutIdleEnabled);
  useIdleTimeout(receiptTimeoutMs, handleIdle, receiptIdleEnabled);

  if (!enabled) return null;

  return (
    <>
      {warningActive ? (
        <InstallationIdleWarning secondsRemaining={secondsRemaining} />
      ) : null}
      {enabled ? (
        <InstallationScreensaver
          open={screensaverActive}
          onDismiss={dismissScreensaver}
        />
      ) : null}
    </>
  );
}
