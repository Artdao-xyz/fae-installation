"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { isInstallationMode } from "@/lib/installation-mode";
import { resolvePrintRequestTimeoutMs } from "@/lib/installation/idle";
import { buildSessionReceipt } from "@/lib/session-receipt/build-receipt";
import { buildReceiptViewUrl } from "@/lib/session-receipt/encode";
import { useReceiptViewOrigin } from "@/lib/session-receipt/use-receipt-view-origin";
import { fetchReceiptViewOrigin } from "@/lib/session-receipt/resolve-view-origin";
import {
  logReceiptQrUrl,
  logSessionEvent,
  logSessionReceipt,
  logSessionSnapshot,
  logSessionTrackingEnabled,
} from "@/lib/session-receipt/log";
import { setSessionReceiptRecorder } from "@/lib/session-receipt/recorder";
import {
  createEmptyPath,
  hasPathActivity,
  type SessionPath,
} from "@/lib/session-receipt/path-grid";
import type { SessionEvent, SessionReceipt } from "@/lib/session-receipt/types";
import { InstallationAboutScreen } from "./InstallationAboutScreen";
import { InstallationIntroScreen } from "./InstallationIntroScreen";
import { InstallationPrintConfirmDialog } from "./InstallationPrintConfirmDialog";
import { InstallationCompleteJourneyControl } from "./InstallationCompleteJourneyControl";
import { InstallationPathRecordingLabel } from "./InstallationPathRecordingLabel";
import { InstallationRecordingIndicator } from "./InstallationRecordingIndicator";
import { MousePathTracker } from "./MousePathTracker";
import { ReceiptPreviewModal } from "./ReceiptPreviewModal";
import type { PrintStatus } from "./print-status";
import { INSTALLATION_OVERLAY_TRANSITION_MS } from "./use-installation-overlay-enter";

type SessionReceiptContextValue = {
  enabled: boolean;
  recording: boolean;
  events: SessionEvent[];
  sessionStart: string;
  pathRef: RefObject<SessionPath>;
  aboutOpen: boolean;
  printConfirmOpen: boolean;
  previewOpen: boolean;
  printStatus: PrintStatus;
  printMessage: string | null;
  screensaverActive: boolean;
  buildReceipt: () => SessionReceipt;
  openPrintConfirm: () => void;
  closePrintConfirm: () => void;
  confirmEndJourney: () => Promise<void>;
  closePreview: () => void;
  printReceipt: (receipt: SessionReceipt) => Promise<boolean>;
  startRecording: () => void;
  clearSession: () => void;
  openAbout: () => void;
  closeAbout: () => void;
  enterScreensaver: () => void;
  dismissScreensaver: () => void;
};

const SessionReceiptContext = createContext<SessionReceiptContextValue | null>(
  null,
);

export function SessionReceiptProvider({ children }: { children: ReactNode }) {
  const enabled = isInstallationMode();
  const [recording, setRecording] = useState(false);
  const [sessionStart, setSessionStart] = useState("");
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [printConfirmOpen, setPrintConfirmOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<SessionReceipt | null>(
    null,
  );
  const [printStatus, setPrintStatus] = useState<PrintStatus>("idle");
  const [printMessage, setPrintMessage] = useState<string | null>(null);
  const [screensaverActive, setScreensaverActive] = useState(false);
  const didLogInitRef = useRef(false);
  const previewClearTimerRef = useRef<number | null>(null);
  const pathRef = useRef<SessionPath>(createEmptyPath());
  const { origin: viewOrigin, ready: originReady } = useReceiptViewOrigin();

  const appendEvent = useCallback((event: SessionEvent) => {
    setEvents((prev) => {
      logSessionEvent(event, prev.length);
      return [...prev, event];
    });
  }, []);

  const schedulePreviewReceiptClear = useCallback(() => {
    if (previewClearTimerRef.current !== null) {
      window.clearTimeout(previewClearTimerRef.current);
    }
    previewClearTimerRef.current = window.setTimeout(() => {
      setPreviewReceipt(null);
      previewClearTimerRef.current = null;
    }, INSTALLATION_OVERLAY_TRANSITION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (previewClearTimerRef.current !== null) {
        window.clearTimeout(previewClearTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled || !recording) {
      setSessionReceiptRecorder(null);
      return;
    }
    setSessionReceiptRecorder(appendEvent);
    if (!didLogInitRef.current) {
      didLogInitRef.current = true;
      logSessionTrackingEnabled();
    }
    return () => setSessionReceiptRecorder(null);
  }, [enabled, recording, appendEvent]);

  const startRecording = useCallback(() => {
    setScreensaverActive(false);
    setAboutOpen(false);
    const nextStart = new Date().toISOString();
    pathRef.current = createEmptyPath();
    setRecording(true);
    setSessionStart(nextStart);
    setEvents([]);
    setPrintConfirmOpen(false);
    setPreviewOpen(false);
    schedulePreviewReceiptClear();
    setPrintStatus("idle");
    setPrintMessage(null);
    logSessionSnapshot("recording started", nextStart, []);
  }, [schedulePreviewReceiptClear]);

  const buildReceipt = useCallback(() => {
    const receipt = buildSessionReceipt(
      sessionStart,
      events,
      new Date().toISOString(),
      pathRef.current,
    );
    logSessionReceipt("build receipt", receipt);
    return receipt;
  }, [sessionStart, events]);

  const clearSession = useCallback(() => {
    logSessionSnapshot("session cleared", sessionStart, events);
    pathRef.current = createEmptyPath();
    setRecording(false);
    setSessionStart("");
    setEvents([]);
    setAboutOpen(false);
    setPrintConfirmOpen(false);
    setPreviewOpen(false);
    schedulePreviewReceiptClear();
    setPrintStatus("idle");
    setPrintMessage(null);
  }, [sessionStart, events, schedulePreviewReceiptClear]);

  const openAbout = useCallback(() => {
    setAboutOpen(true);
  }, []);

  const closeAbout = useCallback(() => {
    setAboutOpen(false);
  }, []);

  const openPrintConfirm = useCallback(() => {
    setPrintConfirmOpen(true);
  }, []);

  const closePrintConfirm = useCallback(() => {
    setPrintConfirmOpen(false);
  }, []);

  const enterScreensaver = useCallback(() => {
    setAboutOpen(false);
    setPrintConfirmOpen(false);
    setScreensaverActive(true);
  }, []);

  const dismissScreensaver = useCallback(() => {
    setScreensaverActive(false);
  }, []);

  const printReceipt = useCallback(
    async (receipt: SessionReceipt, scanOrigin?: string): Promise<boolean> => {
      setPrintStatus("printing");
      setPrintMessage(null);
      const origin = scanOrigin ?? viewOrigin;
      const timeoutMs = resolvePrintRequestTimeoutMs();
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch("/api/print", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...(origin ? { "X-Receipt-View-Origin": origin } : {}),
          },
          body: JSON.stringify(receipt),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          setPrintStatus(res.status === 503 ? "offline" : "error");
          setPrintMessage(data.error ?? "Print failed");
          return false;
        }
        setPrintStatus("idle");
        setPrintMessage("Sent to printer");
        return true;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setPrintStatus("error");
          setPrintMessage("Print timed out — try again");
        } else {
          setPrintStatus("offline");
          setPrintMessage("Printer unreachable");
        }
        return false;
      } finally {
        window.clearTimeout(timeoutId);
      }
    },
    [viewOrigin],
  );

  const confirmEndJourney = useCallback(async () => {
    const receipt = buildReceipt();
    const origin = originReady ? viewOrigin : await fetchReceiptViewOrigin();
    setPrintStatus("printing");
    setPrintMessage(null);
    setPreviewReceipt(receipt);
    setPreviewOpen(true);
    setPrintConfirmOpen(false);
    setRecording(false);
    logReceiptQrUrl(buildReceiptViewUrl(receipt, origin));
    await printReceipt(receipt, origin);
  }, [buildReceipt, viewOrigin, originReady, printReceipt]);

  const retryPrint = useCallback(async () => {
    if (!previewReceipt) return;
    const origin = originReady ? viewOrigin : await fetchReceiptViewOrigin();
    await printReceipt(previewReceipt, origin);
  }, [previewReceipt, printReceipt, viewOrigin, originReady]);

  const showIntro =
    enabled && !recording && !screensaverActive && !aboutOpen && !previewOpen;

  const minimalJourney =
    events.length === 0 && !hasPathActivity(pathRef.current);

  const value = useMemo<SessionReceiptContextValue>(
    () => ({
      enabled,
      recording,
      events,
      sessionStart,
      pathRef,
      aboutOpen,
      printConfirmOpen,
      previewOpen,
      printStatus,
      printMessage,
      screensaverActive,
      buildReceipt,
      openPrintConfirm,
      closePrintConfirm,
      confirmEndJourney,
      closePreview: () => {
        setPreviewOpen(false);
        schedulePreviewReceiptClear();
      },
      printReceipt,
      startRecording,
      clearSession,
      openAbout,
      closeAbout,
      enterScreensaver,
      dismissScreensaver,
    }),
    [
      enabled,
      recording,
      events,
      sessionStart,
      aboutOpen,
      printConfirmOpen,
      previewOpen,
      printStatus,
      printMessage,
      screensaverActive,
      buildReceipt,
      openPrintConfirm,
      closePrintConfirm,
      confirmEndJourney,
      printReceipt,
      startRecording,
      clearSession,
      openAbout,
      closeAbout,
      enterScreensaver,
      dismissScreensaver,
      schedulePreviewReceiptClear,
    ],
  );

  return (
    <SessionReceiptContext.Provider value={value}>
      {enabled ? <MousePathTracker /> : null}
      {enabled ? <InstallationRecordingIndicator /> : null}
      {enabled ? <InstallationPathRecordingLabel /> : null}
      {enabled ? <InstallationCompleteJourneyControl /> : null}
      {children}
      {enabled ? (
        <InstallationIntroScreen
          open={showIntro}
          onReadAbout={openAbout}
          onStartJourney={startRecording}
        />
      ) : null}
      {enabled ? (
        <InstallationAboutScreen open={aboutOpen} onClose={closeAbout} />
      ) : null}
      {enabled ? (
        <InstallationPrintConfirmDialog
          open={printConfirmOpen}
          minimalJourney={minimalJourney}
          onConfirm={confirmEndJourney}
          onKeepExploring={closePrintConfirm}
        />
      ) : null}
      {enabled && previewReceipt ? (
        <ReceiptPreviewModal
          open={previewOpen}
          receipt={previewReceipt}
          printStatus={printStatus}
          printMessage={printMessage}
          onRetryPrint={retryPrint}
        />
      ) : null}
    </SessionReceiptContext.Provider>
  );
}

export function useSessionReceipt(): SessionReceiptContextValue {
  const ctx = useContext(SessionReceiptContext);
  if (!ctx) {
    throw new Error(
      "useSessionReceipt must be used within SessionReceiptProvider",
    );
  }
  return ctx;
}
