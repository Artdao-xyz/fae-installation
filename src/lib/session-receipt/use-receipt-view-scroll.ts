"use client";

import { useEffect } from "react";

const RECEIPT_VIEW_HTML_CLASS = "receipt-view-route";

/** Allow document scroll on /v — mobile globals fix `body` for the archive home only. */
export function useReceiptViewScroll() {
  useEffect(() => {
    document.documentElement.classList.add(RECEIPT_VIEW_HTML_CLASS);
    return () => {
      document.documentElement.classList.remove(RECEIPT_VIEW_HTML_CLASS);
    };
  }, []);
}
