"use client";

import type { ReactNode } from "react";
import { useReceiptViewScroll } from "@/lib/session-receipt/use-receipt-view-scroll";

export function ReceiptViewScroll({ children }: { children: ReactNode }) {
  useReceiptViewScroll();
  return children;
}

/**
 * Adds the scroll-unlock class to <html> during initial HTML parse — before
 * React hydrates — so a freshly scanned QR page is scrollable immediately.
 * The global mobile stylesheet locks `html, body { position: fixed }`; without
 * this the page is frozen until the client `useEffect` runs. Client-side
 * navigation is still covered by `ReceiptViewScroll` (useEffect).
 */
export function ReceiptViewScrollScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html:
          "document.documentElement.classList.add('receipt-view-route')",
      }}
    />
  );
}
