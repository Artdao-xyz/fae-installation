"use client";

import { useEffect, useState } from "react";
import {
  fetchReceiptViewOrigin,
  isLocalHostname,
  pickReceiptViewOrigin,
} from "./resolve-view-origin";

export type ReceiptViewOriginState = {
  origin: string;
  /** False on localhost until LAN IP is resolved (phones cannot scan localhost). */
  ready: boolean;
};

function isOriginReadyInitially(): boolean {
  if (typeof window === "undefined") return false;
  return (
    !isLocalHostname(window.location.hostname) ||
    !!process.env.NEXT_PUBLIC_RECEIPT_VIEW_BASE_URL?.trim()
  );
}

/** Resolves the QR scan target; waits for LAN IP when the kiosk runs on localhost. */
export function useReceiptViewOrigin(): ReceiptViewOriginState {
  const [resolvedOrigin, setResolvedOrigin] = useState<string | null>(null);
  const [ready, setReady] = useState(isOriginReadyInitially);

  useEffect(() => {
    if (ready) return;

    let cancelled = false;
    void fetchReceiptViewOrigin().then((origin) => {
      if (!cancelled) {
        setResolvedOrigin(origin);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ready]);

  return {
    origin: pickReceiptViewOrigin(resolvedOrigin ?? undefined),
    ready,
  };
}
