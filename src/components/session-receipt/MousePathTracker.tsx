"use client";

import { useEffect, useRef } from "react";
import { samplePathPoint } from "@/lib/session-receipt/path-grid";
import { useSessionReceipt } from "./SessionReceiptProvider";

const SAMPLE_MS = 120;

/** Samples pointer movement into the session path grid while recording. */
export function MousePathTracker() {
  const { enabled, recording, pathRef } = useSessionReceipt();
  const lastSampleRef = useRef(0);

  useEffect(() => {
    if (!enabled || !recording || typeof window === "undefined") return;

    const onPointer = (event: PointerEvent) => {
      const now = Date.now();
      if (now - lastSampleRef.current < SAMPLE_MS) return;
      lastSampleRef.current = now;
      samplePathPoint(pathRef.current, event.clientX, event.clientY);
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => window.removeEventListener("pointermove", onPointer);
  }, [enabled, recording, pathRef]);

  useEffect(() => {
    if (!recording) lastSampleRef.current = 0;
  }, [recording]);

  return null;
}
