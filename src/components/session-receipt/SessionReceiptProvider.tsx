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
  type SessionPath,
} from "@/lib/session-receipt/path-grid";
import type { SessionEvent, SessionReceipt } from "@/lib/session-receipt/types";
import { MousePathTracker } from "./MousePathTracker";
import { InstallationControls } from "./InstallationControls";
import { ReceiptPreviewModal } from "./ReceiptPreviewModal";
import { SessionStartDialog } from "./SessionStartDialog";
import type { PrintStatus } from "./print-status";

type SessionReceiptContextValue = {
  enabled: boolean;
  recording: boolean;
  events: SessionEvent[];
  sessionStart: string;
  pathRef: RefObject<SessionPath>;
  previewOpen: boolean;
  printStatus: PrintStatus;
  printMessage: string | null;
  buildReceipt: () => SessionReceipt;
  openPreview: () => void;
  closePreview: () => void;
  printReceipt: (receipt: SessionReceipt) => Promise<void>;
  startRecording: () => void;
  clearSession: () => void;
};

const SessionReceiptContext = createContext<SessionReceiptContextValue | null>(
  null,
);

export function SessionReceiptProvider({ children }: { children: ReactNode }) {
  const enabled = isInstallationMode();
  const [recording, setRecording] = useState(false);
  const [sessionStart, setSessionStart] = useState("");
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<SessionReceipt | null>(
    null,
  );
  const [printStatus, setPrintStatus] = useState<PrintStatus>("idle");
  const [printMessage, setPrintMessage] = useState<string | null>(null);
  const didLogInitRef = useRef(false);
  const pathRef = useRef<SessionPath>(createEmptyPath());
  const { origin: viewOrigin, ready: originReady } = useReceiptViewOrigin();

  const appendEvent = useCallback((event: SessionEvent) => {
    setEvents((prev) => {
      logSessionEvent(event, prev.length);
      return [...prev, event];
    });
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
    const nextStart = new Date().toISOString();
    pathRef.current = createEmptyPath();
    setRecording(true);
    setSessionStart(nextStart);
    setEvents([]);
    setPreviewOpen(false);
    setPreviewReceipt(null);
    setPrintStatus("idle");
    setPrintMessage(null);
    logSessionSnapshot("recording started", nextStart, []);
  }, []);

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
    setPreviewOpen(false);
    setPreviewReceipt(null);
    setPrintStatus("idle");
    setPrintMessage(null);
  }, [sessionStart, events]);

  const printReceipt = useCallback(
    async (receipt: SessionReceipt, scanOrigin?: string) => {
      setPrintStatus("printing");
      setPrintMessage(null);
      const origin = scanOrigin ?? viewOrigin;
      try {
        const res = await fetch("/api/print", {
          method: "POST",
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
          return;
        }
        setPrintStatus("idle");
        setPrintMessage("Sent to printer");
      } catch {
        setPrintStatus("offline");
        setPrintMessage("Printer unreachable");
      }
    },
    [viewOrigin],
  );

  const openPreview = useCallback(async () => {
    const receipt = buildReceipt();
    const origin = originReady ? viewOrigin : await fetchReceiptViewOrigin();
    setPreviewReceipt(receipt);
    logReceiptQrUrl(buildReceiptViewUrl(receipt, origin));
    setPreviewOpen(true);
    await printReceipt(receipt, origin);
  }, [buildReceipt, printReceipt, viewOrigin, originReady]);

  const value = useMemo<SessionReceiptContextValue>(
    () => ({
      enabled,
      recording,
      events,
      sessionStart,
      pathRef,
      previewOpen,
      printStatus,
      printMessage,
      buildReceipt,
      openPreview,
      closePreview: () => {
        setPreviewOpen(false);
        setPreviewReceipt(null);
      },
      printReceipt,
      startRecording,
      clearSession,
    }),
    [
      enabled,
      recording,
      events,
      sessionStart,
      previewOpen,
      printStatus,
      printMessage,
      buildReceipt,
      openPreview,
      printReceipt,
      startRecording,
      clearSession,
    ],
  );

  return (
    <SessionReceiptContext.Provider value={value}>
      {enabled ? <MousePathTracker /> : null}
      {enabled ? <InstallationControls /> : null}
      {children}
      {enabled && !recording ? (
        <SessionStartDialog onStart={startRecording} />
      ) : null}
      {enabled && previewOpen && previewReceipt ? (
        <ReceiptPreviewModal
          receipt={previewReceipt}
          printStatus={printStatus}
          printMessage={printMessage}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewReceipt(null);
          }}
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
