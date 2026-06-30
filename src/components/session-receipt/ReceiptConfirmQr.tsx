"use client";

import { useMemo } from "react";
import { buildReceiptQrPayload } from "@/lib/session-receipt/encode";
import type { SessionReceipt } from "@/lib/session-receipt/types";
import { RECEIPT_DIGITAL_SCALE } from "@/lib/session-receipt/thermal-spec";
import { useReceiptViewOrigin } from "@/lib/session-receipt/use-receipt-view-origin";
import { ReceiptDigitalQr } from "./ReceiptDigitalAssets";

/** Kiosk confirm screen — QR rendered below instructions for natural page scroll. */
export function ReceiptConfirmQr({ receipt }: { receipt: SessionReceipt }) {
  const { origin: viewOrigin } = useReceiptViewOrigin();
  const payload = useMemo(
    () => buildReceiptQrPayload(receipt, viewOrigin)?.encoded ?? "",
    [receipt, viewOrigin],
  );

  if (!payload) return null;

  return (
    <div className="flex w-full justify-center pb-8">
      <ReceiptDigitalQr payload={payload} scale={RECEIPT_DIGITAL_SCALE} />
    </div>
  );
}
